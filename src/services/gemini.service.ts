
import { Injectable } from '@angular/core';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI | null = null;
  private readonly MODEL_NAME = 'gemini-2.5-flash';

  constructor() {
    // IMPORTANT: The API key is sourced from environment variables for security.
    // Do not hardcode API keys in the application.
    const apiKey = process.env.API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    } else {
      console.error('API_KEY environment variable not set. Gemini features will be disabled.');
    }
  }

  async identifyProductFromImage(base64ImageData: string): Promise<string> {
    if (!this.ai) {
      return Promise.reject('Gemini AI client is not initialized. Check API Key.');
    }
    if (!base64ImageData) {
        return Promise.reject('No image data provided.');
    }
    
    try {
      const imagePart = {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64ImageData,
        },
      };
      const textPart = {
        text: '¿Cuál es el producto principal en esta imagen? Responde solo con un nombre corto y buscable para el producto (ej., "taza de café", "laptop").'
      };

      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: this.MODEL_NAME,
        contents: { parts: [imagePart, textPart] },
      });
      
      const text = response.text.trim();
      return text;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw new Error('Could not identify the product from the image.');
    }
  }
}
