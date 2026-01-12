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

app.get('/api/subtitles', (req, res) => {
    const { hash, query, lang, name, size } = req.query;

    const language = lang || 'pt'; 
    // If we have a hash, Subliminal needs size and name to verify.
    // If we have a query, it treats it as a name guess.
    const filename = name || query || 'unknown_video.mkv';
    const fileSize = size || '0';

    console.log(`[Server] Searching via Subliminal. Name: ${filename}, Hash: ${hash || 'N/A'}, Size: ${fileSize}, Lang: ${language}`);

    const scriptPath = path.resolve(__dirname, '../python/search_subtitles.py');
    const args = [
        scriptPath,
        '--name', filename,
        '--size', fileSize,
        '--lang', language
    ];

    if (hash) {
        args.push('--hash', hash);
    }

    const pythonProcess = spawn('python', args);

    let subtitleContent = Buffer.alloc(0);
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
        subtitleContent = Buffer.concat([subtitleContent, data]);
    });

    pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
        if (code === 0 && subtitleContent.length > 0) {
            console.log('[Server] Subtitle found via Subliminal!');
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.send(subtitleContent);
        } else {
            console.warn(`[Server] Subliminal exited with code ${code}`);
            if (errorOutput) console.warn(`[Server] Stderr: ${errorOutput}`);
            
            res.status(404).json({ message: 'Subtitle not found via Subliminal', details: errorOutput });
        }
    });
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
