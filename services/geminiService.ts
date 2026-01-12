import { GoogleGenerativeAI } from "@google/generative-ai";

let aiClient: GoogleGenerativeAI | null = null;

const getAiClient = () => {
  if (!aiClient) {
      const apiKey = import.meta.env.VITE_API_KEY;
      if (!apiKey || apiKey.includes('PLACEHOLDER')) {
           throw new Error("API Key is missing or invalid. Please check VITE_API_KEY in .env.local");
      }
      aiClient = new GoogleGenerativeAI(apiKey);
  }
  return aiClient;
};

const fileToGenerativePart = (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const generateSubtitles = async (file: File, targetLanguage: string = 'Portuguese (Brazil)'): Promise<string> => {
  try {
    const videoPart = await fileToGenerativePart(file);

    // Using gemini-2.0-flash-exp or gemini-1.5-flash for best video performance
    // Correcting model name to a standard stable one
    const model = getAiClient().getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const prompt = `
      You are an expert subtitle generator. 
      Task:
      1. Listen to the audio in the provided video file carefully.
      2. Transcribe the speech.
      3. Translate the speech into ${targetLanguage}.
      4. Format the output strictly as a SubRip (.srt) file.
      
      Constraints:
      - Do not include any introductory or concluding text.
      - Do not wrap the output in markdown code blocks (like \`\`\`srt).
      - Ensure timestamps are accurate and correctly formatted (00:00:00,000 --> 00:00:00,000).
      - The output must be raw SRT content only.
    `;

    const result = await model.generateContent([prompt, videoPart]);
    const response = await result.response;
    const text = response.text();

    if (!text) throw new Error("No response generated from the model.");

    // Simple cleanup in case the model decides to add code blocks despite instructions
    const cleanText = text.replace(/^```(srt)?/gm, '').replace(/```$/gm, '').trim();

    return cleanText;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const translateSrtContent = async (srtContent: string, targetLanguage: string = 'Portuguese (Brazil)'): Promise<string> => {
   try {
    const model = getAiClient().getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Warning: Sending extremely large SRT files in one go might hit token limits.
    // Ideally we should split by chunks, but for now we try full file or first X chars.
    
    const prompt = `
      You are an expert subtitle translator.
      Task:
      1. Translate the following SubRip (.srt) content into ${targetLanguage}.
      2. PRESERVE the subtitle indices (1, 2, 3...) and timestamps (00:00:00,000 --> ...) EXACTLY as they are.
      3. Do NOT translate the proper names if inappropriate, but adapt cultural terms if necessary.
      4. Output ONLY the translated SRT content. No markdown, no notes.
      
      Input SRT:
      ${srtContent}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) throw new Error("No translation generated.");

    return text.replace(/^```(srt)?/gm, '').replace(/```$/gm, '').trim();
   } catch (error) {
     console.error("Gemini Translation Error:", error);
     throw error;
   }
};
