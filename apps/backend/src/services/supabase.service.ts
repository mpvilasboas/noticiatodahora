import { createClient } from '@supabase/supabase-js';
import { ENV } from '../config/env.js';
import { GeneratedContent } from './geminiLLM.service.js';

let supabaseClient: any = null;

if (ENV.SUPABASE_URL && ENV.SUPABASE_SERVICE_ROLE_KEY) {
  supabaseClient = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY);
}

export interface SaveReportDTO {
  userId: string;
  locationAddress: string;
  latitude?: number;
  longitude?: number;
  audioUrl?: string;
  photoUrl?: string;
  transcription: string;
  userNotes?: string;
  generatedContent: GeneratedContent;
}

export async function saveReportToDatabase(dto: SaveReportDTO) {
  if (!supabaseClient) {
    console.warn('[Supabase DB] Supabase credentials not set. Returning mock saved record.');
    return {
      id: `mock-report-${Date.now()}`,
      status: 'enviado_redacao',
      created_at: new Date().toISOString(),
      ...dto
    };
  }

  const { data, error } = await supabaseClient
    .from('reports')
    .insert([
      {
        user_id: dto.userId,
        location_address: dto.locationAddress,
        latitude: dto.latitude,
        longitude: dto.longitude,
        audio_url: dto.audioUrl,
        photo_url: dto.photoUrl,
        transcription: dto.transcription,
        user_notes: dto.userNotes,
        portal_article: dto.generatedContent.portalArticle,
        radio_script: dto.generatedContent.radioScript,
        status: 'enviado_redacao'
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('[Supabase DB] Failed to save report:', error);
    throw error;
  }

  return data;
}
