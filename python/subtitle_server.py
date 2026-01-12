import sys
import json
import logging
from subliminal import download_best_subtitles, Video
from babelfish import Language
import chardet
# New imports for Yify
import requests
from bs4 import BeautifulSoup
import io
import zipfile
import re

# Configure logging
logging.getLogger('subliminal').setLevel(logging.CRITICAL)

def search_yify(query, lang_code):
    try:
        # Simple mapping for Yify
        lang_map = {
            'pt-br': 'portuguese',
            'pt': 'portuguese',
            'en': 'english',
            'eng': 'english',
            'es': 'spanish',
            'spa': 'spanish',
            'fr': 'french',
            'fra': 'french',
            'de': 'german',
            'deu': 'german',
            'it': 'italian',
            'ita': 'italian',
            'ru': 'russian',
            'rus': 'russian',
            'tr': 'turkish',
            'tur': 'turkish',
            'all': 'all' # Special case handled?
        }
        
        target_lang = lang_map.get(lang_code.lower(), 'english')
        
        # Clean query: Remove extension, dots, replace spaces with +
        clean_query = query
        # Remove extension
        if '.[a-z0-9]' in clean_query.lower()[-5:]:
             clean_query = clean_query.rsplit('.', 1)[0]
        
        # Remove year/quality if it helps search? Subliminal already parses this into 'video', 
        # but for Yify query we probably want main title.
        # Actually Yify search is fuzzy. "Avatar 2009" works.
        
        sys.stderr.write(f"[Yify] Searching for: {clean_query} ({target_lang})\n")
        
        base_url = "https://yifysubtitles.ch" # Mirror
        search_url = f"{base_url}/search?q={clean_query}"
        
        # 1. Search
        r = requests.get(search_url, timeout=5)
        if r.status_code != 200:
             return None
             
        soup = BeautifulSoup(r.text, 'lxml')
        
        # Find first movie result
        # Structure varies. Look for media-body or specific classes
        media_objects = soup.select('.media-body')
        
        if not media_objects:
             return None
             
        # Pick first one or match year? simple: first one.
        movie_link_tag = media_objects[0].find('a')
        if not movie_link_tag:
             return None
             
        movie_url = base_url + movie_link_tag['href']
        sys.stderr.write(f"[Yify] Found movie page: {movie_url}\n")
        
        # 2. Get Movie Page
        r_movie = requests.get(movie_url, timeout=5)
        soup_movie = BeautifulSoup(r_movie.text, 'lxml')
        
        # 3. Find Subtitle Row
        # Look for tr containing language
        # .table-responsive -> table -> tbody -> tr
        
        rows = soup_movie.select('tr')
        download_link = None
        
        for row in rows:
            text = row.get_text().lower()
            if target_lang in text or lang_code == 'all':
                # Check for 'download' link
                link = row.find('a', href=re.compile(r'/subtitles/.*\.zip'))
                if link:
                    download_link = base_url + link['href']
                    # Prefer high rating? Usually sorted.
                    # Just take first one.
                    break
        
        if not download_link:
             sys.stderr.write(f"[Yify] No subtitle found for {target_lang}\n")
             return None
             
        # 4. Download Zip
        sys.stderr.write(f"[Yify] Downloading zip: {download_link}\n")
        r_zip = requests.get(download_link, timeout=10)
        
        with zipfile.ZipFile(io.BytesIO(r_zip.content)) as z:
            # valid extensions
            exts = ('.srt', '.sub')
            for filename in z.namelist():
                if filename.lower().endswith(exts):
                    # Found it
                    content_bytes = z.read(filename)
                    # Try decode
                    try:
                        return content_bytes.decode('utf-8')
                    except:
                        return content_bytes.decode('latin-1', errors='replace')
                        
        return None
        
    except Exception as e:
        sys.stderr.write(f"[Yify] Error: {e}\n")
        return None

def search_subtitles(movie_hash, file_name, file_size, lang_code):
    try:
        video = Video.fromname(file_name)
        video.size = int(file_size)
        if movie_hash:
            video.hashes['opensubtitles'] = movie_hash

        if lang_code.lower() == 'pt-br':
            languages = {Language('por', 'BR')}
        elif lang_code.lower() in ['en', 'eng']:
            languages = {Language('eng')}
        elif lang_code.lower() == 'all':
             languages = {
                Language('eng'), Language('spa'), Language('fra'),
                Language('deu'), Language('ita'), Language('por'),
                Language('rus'), Language('tur')
            }
        else:
            try:
                languages = {Language(lang_code)}
            except:
                languages = {Language('eng')}

        # Reduced providers for speed? Or keep them.
        available_providers = ['opensubtitles', 'podnapisi']
        
        best_subtitles = download_best_subtitles([video], languages, providers=available_providers)
        
        if video in best_subtitles and best_subtitles[video]:
            sub = best_subtitles[video][0]
            content = sub.content
            
            # Encoding Fix
            encoding = 'utf-8'
            try:
                detection = chardet.detect(content)
                if detection['encoding'] and detection['confidence'] > 0.7:
                    encoding = detection['encoding']
            except:
                pass

            try:
                decoded_text = content.decode(encoding, errors='replace')
            except:
                decoded_text = content.decode('latin-1', errors='replace')

            return {"found": True, "content": decoded_text}
        
        # --- Fallback to Yify if Subliminal fails ---
        # Only if searching by name (not hash specifically, though we have hash)
        sys.stderr.write("[Server] Subliminal found nothing. Trying YifySubtitles...\n")
        yify_content = search_yify(video.title, lang_code) # video.title parsed by subliminal is cleaner
        
        if yify_content:
             return {"found": True, "content": yify_content}
        
        return {"found": False}
    except Exception as e:
        return {"error": str(e)}

def main():
    sys.stderr.write("Python Subtitle Service Started. Waiting for input...\n")
    while True:
        try:
            line = sys.stdin.readline()
            if not line:
                break
            
            data = json.loads(line)
            # Expected: {"hash": "...", "name": "...", "size": 123, "lang": "..."}
            
            result = search_subtitles(
                data.get('hash'),
                data.get('name', 'unknown'),
                data.get('size', 0),
                data.get('lang', 'en')
            )
            
            # Print JSON result to stdout
            print(json.dumps(result))
            sys.stdout.flush()
        except json.JSONDecodeError:
            print(json.dumps({"error": "Invalid JSON input"}))
            sys.stdout.flush()
        except Exception as e:
            print(json.dumps({"error": str(e)}))
            sys.stdout.flush()

if __name__ == "__main__":
    main()
