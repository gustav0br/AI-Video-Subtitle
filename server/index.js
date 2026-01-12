import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env.local from the root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

// --- Persistent Python Process for Search ---
let pythonSearchProcess = null;

const startPythonProcess = () => {
    const scriptPath = path.resolve(__dirname, '../python/subtitle_server.py');
    pythonSearchProcess = spawn('python', [scriptPath]);
    
    pythonSearchProcess.stderr.on('data', (data) => {
        console.log(`[Python Worker]: ${data}`);
    });

    pythonSearchProcess.on('close', (code) => {
        console.log(`[Python Worker] Exited with code ${code}. Restarting...`);
        setTimeout(startPythonProcess, 1000); // Restart after 1s
    });
    
    console.log('[Server] Python Subtitle Worker started.');
};

startPythonProcess();

app.get('/api/subtitles', (req, res) => {
    const { hash, query, lang, name, size } = req.query;

    const language = lang || 'pt'; 
    const filename = name || query || 'unknown_video.mkv';
    const fileSize = size || '0';

    if (!pythonSearchProcess) {
        return res.status(500).send('Search service unavailable');
    }

    const requestPayload = JSON.stringify({
        hash: hash || null,
        name: filename,
        size: fileSize,
        lang: language
    }) + '\n';

    // We can't easily correlate stdin/stdout in a simple pipe without ID.
    // BUT since Node.js is single threaded for this event loop, and we want to keep it simple:
    // We will use "once" listener. 
    // WARNING: This assumes strictly sequential processing matching request/response.
    // Since spawn streams are ordered, if we write and listen for the NEXT data event, it works 
    // *if* the python script guarantees exactly one line of output per input.
    // For high concurrency, we'd need request IDs.
    
    const onData = (data) => {
        try {
            const result = JSON.parse(data.toString());
            pythonSearchProcess.stdout.removeListener('data', onData); // Clean up listener
            
            if (result.found && result.content) {
                console.log('[Server] Subtitle found!');
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.send(result.content);
            } else if (result.error) {
                console.warn(`[Server] Python Error: ${result.error}`);
                res.status(500).send(result.error);
            } else {
                console.log('[Server] No subtitle found.');
                res.status(404).send('Not found');
            }
        } catch (e) {
            console.error('Error parsing python response:', e);
            // Don't remove listener if it was partial data? 
            // For simplicity, we assume full line JSON.
        }
    };

    pythonSearchProcess.stdout.once('data', onData);
    pythonSearchProcess.stdin.write(requestPayload);
});

app.post('/api/translate', (req, res) => {
    const { content, source, target } = req.body;
    
    if (!content) {
        return res.status(400).send('Missing content');
    }

    const scriptPath = path.resolve(__dirname, '../python/translate_subtitles.py');
    const args = [
        scriptPath,
        '--source', source || 'auto',
        '--target', target || 'pt'
    ];
    
    console.log(`[Server] Translating subtitle... Source: ${source}, Target: ${target}`);

    const pythonProcess = spawn('python', args);
    
    let translatedContent = Buffer.alloc(0);
    let errorOutput = '';

    // Write content to stdin
    pythonProcess.stdin.write(content);
    pythonProcess.stdin.end();

    pythonProcess.stdout.on('data', (data) => {
        translatedContent = Buffer.concat([translatedContent, data]);
    });

    pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
        // Log progress but don't spam
        if (!data.toString().includes('Progress:')) {
             console.log(`[Server] Helper: ${data}`);
        }
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
             console.error(`[Server] Translation failed. Code: ${code}`);
             if (errorOutput) console.error(`[Server] Stderr: ${errorOutput}`);
             res.status(500).send('Translation failed');
        } else {
             console.log('[Server] Translation complete.');
             res.setHeader('Content-Type', 'text/plain; charset=utf-8');
             res.send(translatedContent);
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
