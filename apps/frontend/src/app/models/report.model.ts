export interface QueuedReport {
  id?: number;
  audioBlob?: Blob;
  audioMimeType?: string;
  photoBlob?: Blob;
  photoMimeType?: string;
  latitude?: number;
  longitude?: number;
  userNotes?: string;
  createdAt: string;
}

export interface GeneratedReportResponse {
  message: string;
  report: {
    id: string;
    location_address: string;
    transcription: string;
    user_notes?: string;
    portal_article: {
      headline: string;
      lead: string;
      bodyMarkdown: string;
      photoCaption: string;
      tags: string[];
    };
    radio_script: {
      title: string;
      broadcastScript: string;
      durationEstimateSeconds: number;
    };
    status: string;
    created_at: string;
  };
}
