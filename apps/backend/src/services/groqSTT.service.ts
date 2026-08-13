import { ENV } from '../config/env.js';

export async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
  if (!ENV.GROQ_API_KEY) {
    console.warn('[Groq STT] GROQ_API_KEY not configured. Returning fallback transcription text.');
    return 'Relato de teste gravado no campo pelo jornalista sobre o evento ocorrido no local.';
  }

  try {
    const formData = new FormData();
    const extension = mimeType.includes('webm') ? 'webm' : mimeType.includes('mp3') ? 'mp3' : 'wav';
    
    // Create Blob from Buffer
    const arrayBuffer = audioBuffer.buffer.slice(audioBuffer.byteOffset, audioBuffer.byteOffset + audioBuffer.byteLength);
    const audioBlob = new Blob([arrayBuffer], { type: mimeType });
    
    formData.append('file', audioBlob, `audio.${extension}`);
    formData.append('model', 'whisper-large-v3');
    formData.append('language', 'pt');
    formData.append('temperature', '0.0');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ENV.GROQ_API_KEY}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error (${response.status}): ${errorText}`);
    }

    const data: any = await response.json();
    return data.text || '';
  } catch (error) {
    console.error('[Groq STT] Transcription failed:', error);
    throw error;
  }
}
