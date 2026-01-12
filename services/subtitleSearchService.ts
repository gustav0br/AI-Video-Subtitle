import { computeMovieHash } from './hashService';

const getApiUrl = () => {
    // Use the same hostname as the current page to support network access (e.g. 192.168.x.x)
    const hostname = window.location.hostname;
    return `http://${hostname}:3002/api/subtitles`;
};

// Mapping simplified language names to TheSubDB/OpenSubtitles codes
const LANG_MAP: Record<string, string> = {
  'Portuguese (Brazil)': 'pt-br',
  'English': 'eng',
  'Spanish': 'spa',
  'French': 'fra'
};

export const searchSubtitlesByName = async (query: string, languageLabel: string = 'Portuguese (Brazil)'): Promise<string | null> => {
  try {
    const langCode = LANG_MAP[languageLabel] || 'pt';
    console.log(`[SubtitleSearch] Query: ${query}, Lang: ${langCode}. Querying backend...`);

    const params = new URLSearchParams({
      query: query,
      lang: langCode
    });

    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}?${params.toString()}`);

    if (response.ok) {
      const text = await response.text();
      if (text && text.length > 0) {
        console.log('[SubtitleSearch] Subtitle found via Backend!');
        return text;
      }
    } else if (response.status === 404) {
      console.log('[SubtitleSearch] No subtitle found via Backend.');
    } else {
      console.warn(`[SubtitleSearch] Backend returned status: ${response.status}`);
    }
    
    return null;
  } catch (error) {
    console.warn("[SubtitleSearch] Backend search failed or is not running:", error);
    return null;
  }
};

export const searchExistingSubtitles = async (file: File, languageLabel: string = 'Portuguese (Brazil)'): Promise<string | null> => {
  try {
    const hash = await computeMovieHash(file);
    const langCode = LANG_MAP[languageLabel] || 'pt';
    
    console.log(`[SubtitleSearch] File hash: ${hash}, Lang: ${langCode}. Querying backend...`);

    const params = new URLSearchParams({
      hash: hash,      name: file.name,
      size: file.size.toString(),      lang: langCode
    });

    // Call our local backend acting as a proxy
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}?${params.toString()}`);

    if (response.ok) {
      const text = await response.text();
      if (text && text.length > 0) {
          console.log('[SubtitleSearch] Subtitle found via Backend!');
          return text;
      }
    } else if (response.status === 404) {
        console.log('[SubtitleSearch] No subtitle found via Backend.');
    } else {
        console.warn(`[SubtitleSearch] Backend returned status: ${response.status}`);
    }
    
    return null;
  } catch (error) {
    console.warn("[SubtitleSearch] Backend search failed or is not running:", error);
    return null;
  }
};
