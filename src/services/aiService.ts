import { GoogleGenerativeAI } from '@google/generative-ai';

// API Key management
const API_KEY_STORAGE = 'gemini_api_key';
const DEFAULT_API_KEY = 'AIzaSyAPcXroC7OBU0RH-HftxqgiWslIyAuzMNo';

function getApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE) || DEFAULT_API_KEY;
}

export function setApiKey(apiKey: string): void {
  localStorage.setItem(API_KEY_STORAGE, apiKey);
  // Reset usage count when new API key is set
  localStorage.setItem(USAGE_KEY, '0');
  localStorage.setItem(USAGE_DATE_KEY, new Date().toDateString());
}

function getGenAI(): GoogleGenerativeAI {
  return new GoogleGenerativeAI(getApiKey());
}

// Language detection and translation using simple heuristics and fetch API
export async function detectLanguage(text: string): Promise<string> {
  // Simple language detection patterns (expand as needed)
  const patterns = {
    'es': /[ñáéíóúü]/i,
    'fr': /[àáâäçéèêëíîïôöùúûü]/i,
    'de': /[äöüß]/i,
    'it': /[àáèéìíîòóùú]/i,
    'pt': /[ãçáàéêíôõú]/i,
    'ru': /[абвгдеёжзийклмнопрстуфхцчшщъыьэюя]/i,
    'zh': /[\u4e00-\u9fff]/,
    'ja': /[\u3040-\u309f\u30a0-\u30ff]/,
    'ko': /[\uac00-\ud7af]/,
    'ar': /[\u0600-\u06ff]/,
    'hi': /[\u0900-\u097f]/
  };

  for (const [lang, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) {
      return lang;
    }
  }
  
  return 'en'; // Default to English
}

export async function translateText(text: string, fromLang: string, toLang: string): Promise<string> {
  if (fromLang === toLang) return text;
  
  try {
    // Using a simple translation service or mock translation for demo
    // In production, you would use Google Translate API or another service
    
    // For now, we'll just return the original text with a note
    // This can be replaced with actual translation service
    if (fromLang !== 'en' && toLang === 'en') {
      return text; // Assume input is already understandable
    }
    
    return text; // Return original for demo purposes
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

// Usage tracking
const USAGE_KEY = 'ai_usage_count';
const USAGE_DATE_KEY = 'ai_usage_date';
const MAX_DAILY_USAGE = 4;

export function checkUsageLimit(): { canUse: boolean; remaining: number } {
  const today = new Date().toDateString();
  const lastUsageDate = localStorage.getItem(USAGE_DATE_KEY);
  let usageCount = parseInt(localStorage.getItem(USAGE_KEY) || '0');

  // Reset count if it's a new day
  if (lastUsageDate !== today) {
    usageCount = 0;
    localStorage.setItem(USAGE_DATE_KEY, today);
    localStorage.setItem(USAGE_KEY, '0');
  }

  const remaining = MAX_DAILY_USAGE - usageCount;
  return {
    canUse: remaining > 0,
    remaining: Math.max(0, remaining)
  };
}

function incrementUsage() {
  const today = new Date().toDateString();
  const usageCount = parseInt(localStorage.getItem(USAGE_KEY) || '0') + 1;
  localStorage.setItem(USAGE_KEY, usageCount.toString());
  localStorage.setItem(USAGE_DATE_KEY, today);
}

export async function generateResponse(
  prompt: string, 
  context?: string, 
  fileContent?: string,
  isImage?: boolean
): Promise<string> {
  // Check usage limit
  const { canUse, remaining } = checkUsageLimit();
  if (!canUse) {
    throw new Error('LIMIT_EXCEEDED');
  }

  try {
    const genAI = getGenAI();
    let fullPrompt = prompt;
    
    if (context) {
      fullPrompt = `Context: ${context}\n\nUser: ${prompt}`;
    }
    
    if (fileContent) {
      if (isImage) {
        // For image analysis, use Gemini Pro Vision
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        // Convert data URL to inline data
        const imageParts = [
          {
            inlineData: {
              data: fileContent.split(',')[1], // Remove data:image/jpeg;base64, prefix
              mimeType: fileContent.split(';')[0].split(':')[1]
            }
          }
        ];
        
        const result = await model.generateContent([
          `Analyze this image and answer: ${prompt}`,
          ...imageParts
        ]);
        
        incrementUsage();
        return result.response.text() || "Unable to analyze image.";
      } else {
        // For text files
        fullPrompt = `Based on this document content:\n\n${fileContent}\n\nUser question: ${prompt}`;
      }
    }
    
    // Use Gemini Pro for text generation
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(fullPrompt);
    
    incrementUsage();
    return result.response.text() || "Unable to generate response.";
  } catch (error: any) {
    console.error('AI response error:', error);
    
    // Handle specific Gemini API errors
    if (error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('API_QUOTA_EXCEEDED');
    } else if (error.message?.includes('API key') || error.message?.includes('INVALID_ARGUMENT')) {
      throw new Error('INVALID_API_KEY');
    } else if (error.message?.includes('forbidden')) {
      throw new Error('API access forbidden. Please check your Gemini account permissions.');
    }
    
    throw new Error('Failed to generate response. Please try again.');
  }
}

export function speakText(text: string, language: string = 'en'): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    // Try to find a voice for the specific language
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith(language)) || voices[0];
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (event) => reject(new Error('Speech synthesis failed'));

    window.speechSynthesis.speak(utterance);
  });
}