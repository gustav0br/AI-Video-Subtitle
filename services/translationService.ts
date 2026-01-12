// Service to handle translations via our Python backend (using deep-translator/LibreTranslate)

const getApiUrl = () => {
    // Use the same hostname as the current page
    const hostname = window.location.hostname;
    return `http://${hostname}:3002/api/translate`;
};

export const translateSrtContent = async (
  srtContent: string, 
  targetLanguageLabel: string = 'Portuguese (Brazil)',
  sourceLanguageLabel: string = 'English' 
): Promise<string> => {
  try {
    const apiUrl = getApiUrl();
    
    // Simple mapping for labels to codes
    const langMap: Record<string, string> = {
        'Portuguese (Brazil)': 'pt',
        'English': 'en',
        'Spanish': 'es',
        'French': 'fr'
    };

    const target = langMap[targetLanguageLabel] || 'pt';
    const source = langMap[sourceLanguageLabel] || 'auto';

    console.log(`[TranslationService] Sending content to ${apiUrl} (Source: ${source}, Target: ${target})`);

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            content: srtContent,
            source: source,
            target: target
        })
    });

    if (!response.ok) {
        throw new Error(`Translation server error: ${response.status} ${response.statusText}`);
    }

    const translatedText = await response.text();
    return translatedText;

  } catch (error) {
    console.error("Translation Service Error:", error);
    throw error;
  }
};
