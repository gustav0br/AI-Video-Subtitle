import sys
import argparse
from subliminal import download_best_subtitles, Video
from babelfish import Language
import logging

import traceback

# Mute subliminal logging
logging.getLogger('subliminal').setLevel(logging.CRITICAL)

def search(movie_hash, file_name, file_size, lang_code):
    try:
        # Use fromname to parse metadata (Season, Episode, Year) from filename
        # This is CRITICAL for text-based search fallback
        video = Video.fromname(file_name)
        video.size = int(file_size)
        if movie_hash:
            video.hashes['opensubtitles'] = movie_hash

        # Map 'pt-br' to babelfish language
        if lang_code.lower() == 'pt-br':
            languages = {Language('por', 'BR')}
        elif lang_code.lower() == 'en':
            languages = {Language('eng')}
        else:
            languages = {Language(lang_code)}

        # Use multiple providers
        # 'opensubtitles': The classic one
        # 'podnapisi': Good alternative
        # Removed 'thesubdb' as it is defunct and causes crash if header incorrect or service down
        available_providers = ['opensubtitles', 'podnapisi']
        
        sys.stderr.write(f"Searching for {video.name} (Metadata: {video}) [Hash: {movie_hash}]\n")

        best_subtitles = download_best_subtitles([video], languages, providers=available_providers)
        
        if video in best_subtitles and best_subtitles[video]:
            sub = best_subtitles[video][0]
            sys.stderr.write(f"Found subtitle from {sub.provider_name}\n")
            
            # --- Encoding Correction Logic ---
            content = sub.content
            text = None
            
            # 1. Try chardet
            try:
                detection = chardet.detect(content)
                if detection['encoding'] and detection['confidence'] > 0.7:
                    try:
                        text = content.decode(detection['encoding'])
                    except UnicodeDecodeError:
                        pass
            except Exception:
                pass
            
            # 2. Try common encodings especially for Portuguese
            if text is None:
                # latin-1 and cp1252 are very common for PT-BR
                encodings = ['utf-8', 'cp1252', 'latin-1', 'iso-8859-1']
                if hasattr(sub, 'encoding') and sub.encoding:
                    encodings.insert(0, sub.encoding)
                
                for enc in encodings:
                    try:
                        text = content.decode(enc)
                        break
                    except UnicodeDecodeError:
                        continue
            
            # 3. Last fallback (latin-1 never fails)
            if text is None:
                text = content.decode('latin-1', errors='replace')

            # Write clean UTF-8 bytes to stdout
            sys.stdout.buffer.write(text.encode('utf-8'))
        else:
            sys.stderr.write("No subtitles found.\n")
            sys.exit(1) # Not found
            
    except Exception as e:
        # Write error to stderr
        sys.stderr.write(f"Error: {str(e)}\n")
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--hash', help='OpenSubtitles hash')
    parser.add_argument('--name', required=True, help='Video filename')
    parser.add_argument('--size', required=True, type=int, help='Video size in bytes')
    parser.add_argument('--lang', default='pt', help='Language code (e.g. pt, en)')
    
    args = parser.parse_args()
    
    search(args.hash, args.name, args.size, args.lang)
