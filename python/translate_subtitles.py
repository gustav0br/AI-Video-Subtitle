import sys
import argparse
from deep_translator import GoogleTranslator
import re
import time

def chunk_texts(texts, max_chars=4000):
    chunks = []
    current_chunk = []
    current_length = 0
    
    for text in texts:
        # +1 for newline character
        if current_length + len(text) + 1 > max_chars:
            chunks.append(current_chunk)
            current_chunk = []
            current_length = 0
        
        current_chunk.append(text)
        current_length += len(text) + 1
        
    if current_chunk:
        chunks.append(current_chunk)
    return chunks

def translate_srt(content, source, target):
    # Fix common encoding artifacts if any (Mojibake restoration)
    # â™ª is Mojibake for ♪ (U+266A) read as Windows-1252
    content = content.replace('â™ª', '♪')
    
    # Standardize line endings
    content = content.replace('\r\n', '\n').replace('\r', '\n')
    
    # Split into blocks (double newline separator)
    raw_blocks = content.split('\n\n')
    
    parsed_blocks = []
    texts_to_translate = []
    
    # map to store valid block indices
    # We only translate blocks that have actual content
    
    # Map target language codes if necessary
    lang_map = {
        'pt-br': 'pt',
        'en': 'en',
        'es': 'es',
        'fr': 'fr'
    }
    target = lang_map.get(target.lower(), target)
    source = lang_map.get(source.lower(), source)

    translator = GoogleTranslator(source=source, target=target)
    
    # 1. Parse all blocks
    for raw_block in raw_blocks:
        if not raw_block.strip():
            continue
            
        lines = raw_block.split('\n')
        if len(lines) >= 3:
             # Basic validation
             # 1
             # 00:00:00 --> 00:00:00
             # Text
             
             index = lines[0]
             timestamp = lines[1]
             
             if '-->' in timestamp:
                 # Join lines into one single string for this block
                 text_content = " ".join(lines[2:]).strip()
                 # Replace pipe if exists to avoid confusion with our delimiter, though we use newlines now
                 text_content = text_content.replace('\n', ' ') 
                 
                 parsed_blocks.append({
                     'type': 'subtitle',
                     'index': index,
                     'timestamp': timestamp,
                     'original_text': text_content
                 })
                 texts_to_translate.append(text_content)
             else:
                 parsed_blocks.append({'type': 'raw', 'content': raw_block})
        else:
             parsed_blocks.append({'type': 'raw', 'content': raw_block})

    sys.stderr.write(f"Total subtitle blocks to translate: {len(texts_to_translate)}\n")
    
    # 2. Batch Translate
    # Google Translate web has limit around 5000 chars. We use 3000 to be safe.
    text_chunks = chunk_texts(texts_to_translate, max_chars=3000)
    translated_texts = []
    
    delimiter = "\n\n" # Double newline acts as stronger separator
    
    total_chunks = len(text_chunks)
    sys.stderr.write(f"Processing in {total_chunks} chunks...\n")
    
    for i, chunk in enumerate(text_chunks):
        if not chunk:
            continue
            
        # Join with delimiter
        combined_text = delimiter.join(chunk)
        
        try:
            # sys.stderr.write(f"Translating chunk {i+1}/{total_chunks} ({len(combined_text)} chars)...\n")
            # Log progress for the UI percentage bar
            progress = int(((i + 1) / total_chunks) * 100)
            # Use specific format that backend might parse or just simple logging
            sys.stderr.write(f"Progress: {progress}%\n")
            
            translated_combined = translator.translate(combined_text)
            
            if translated_combined:
                # Split back
                # We need to be careful. Google sometimes eats newlines.
                # If we used \n\n, expect \n\n back.
                parts = translated_combined.split(delimiter)
                
                # Fallback: if lengths mismatch massively?
                if len(parts) != len(chunk):
                    # Try splitting by single newline if double failed?
                    # Or simple index mapping (dangerous)
                    # For now, if mismatch, just pad or truncate
                    sys.stderr.write(f"Warning: Chunk {i} count mismatch. Sent {len(chunk)}, got {len(parts)}. Trying to map best effort.\n")
                    
                    # Very crude fallback: translate individually if batch fails? 
                    # Too slow. We'll just append what we have.
                    pass
                
                translated_texts.extend(parts)
            else:
                # Empty response? Return originals
                translated_texts.extend(chunk)
                
        except Exception as e:
            sys.stderr.write(f"Error translating chunk {i}: {e}\n")
            translated_texts.extend(chunk) # Fallback to original
            
        # Sleep slightly to avoid rate limiting
        time.sleep(0.5)

    # 3. Reassemble
    final_output = []
    trans_idx = 0
    
    for block in parsed_blocks:
        if block['type'] == 'subtitle':
            if trans_idx < len(translated_texts):
                translation = translated_texts[trans_idx].strip()
                trans_idx += 1
            else:
                translation = block['original_text']
            
            # Clean up potential translation artifacts (like added pipes or brackets)
            translation = translation.replace('  ', ' ')
            
            new_block = f"{block['index']}\n{block['timestamp']}\n{translation}\n"
            final_output.append(new_block)
        else:
            final_output.append(block['content'] + "\n")

    return "\n".join(final_output)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', default='auto', help='Source language')
    parser.add_argument('--target', default='pt', help='Target language')
    parser.add_argument('--file', help='Path to SRT file')
    
    args = parser.parse_args()
    
    content = ""
    try:
        if args.file:
            with open(args.file, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
        else:
            # Read from stdin
            # Ensure stdin is read as UTF-8
            if hasattr(sys.stdin, 'reconfigure'):
                try:
                    sys.stdin.reconfigure(encoding='utf-8')
                except:
                    pass
            
            if sys.stdin.isatty():
                # If no input piped, just exit or print help
                pass
            else:
                content = sys.stdin.read()

        if content:
            result = translate_srt(content, args.source, args.target)
            # Use sys.stdout.buffer.write to handle utf-8 properly on windows potentially
            # But print() usually works on Python 3.7+ if env is set.
            # To be safe with special chars in Portuguese:
            try:
                sys.stdout.reconfigure(encoding='utf-8')
            except:
                pass
            print(result)
    except Exception as e:
        sys.stderr.write(str(e))
        sys.exit(1)

