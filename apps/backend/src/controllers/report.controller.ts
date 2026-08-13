import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { uploadToR2 } from '../services/r2Storage.service.js';
import { reverseGeocode } from '../services/geocoding.service.js';
import { transcribeAudio } from '../services/groqSTT.service.js';
import { generateNewsAndScript } from '../services/geminiLLM.service.js';
import { saveReportToDatabase } from '../services/supabase.service.js';
import { sendReportByEmail } from '../services/email.service.js';

export async function processReport(req: AuthenticatedRequest, res: Response) {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const audioFile = files?.['audio']?.[0];
    const photoFile = files?.['photo']?.[0];

    const latitude = req.body.latitude ? parseFloat(req.body.latitude) : undefined;
    const longitude = req.body.longitude ? parseFloat(req.body.longitude) : undefined;
    const userNotes = req.body.userNotes || '';
    const locationName = req.body.locationName || '';
    const destinationEmail = req.body.destinationEmail || undefined;

    if (!audioFile && !userNotes) {
      return res.status(400).json({ error: 'É necessário enviar ao menos um áudio gravado ou notas de texto.' });
    }

    console.log(`[Report Processing] Received report from user ${req.user?.id || 'anonymous'} (Recipient Email: ${destinationEmail || 'default'})`);

    // 1. Upload files to R2 in parallel
    let audioUrl = '';
    let photoUrl = '';

    const uploadPromises: Promise<void>[] = [];
    if (audioFile) {
      uploadPromises.push(
        uploadToR2(audioFile.buffer, audioFile.mimetype, 'audios').then(url => { audioUrl = url; })
      );
    }
    if (photoFile) {
      uploadPromises.push(
        uploadToR2(photoFile.buffer, photoFile.mimetype, 'photos').then(url => { photoUrl = url; })
      );
    }
    await Promise.all(uploadPromises);

    // 2. Geocodificação Reversa / Localização
    let locationAddress = locationName || 'Localização não informada';
    if (!locationName && latitude !== undefined && longitude !== undefined) {
      const geoResult = await reverseGeocode(latitude, longitude);
      locationAddress = geoResult.address;
    }

    // 3. Transcrição de Áudio (Groq Whisper)
    let transcription = '';
    if (audioFile) {
      transcription = await transcribeAudio(audioFile.buffer, audioFile.mimetype);
    } else {
      transcription = userNotes;
    }

    // 4. Geração Generativa de Matéria + Roteiro Rádio (Gemini)
    const generatedContent = await generateNewsAndScript(transcription, userNotes, locationAddress);

    // 5. Salva no Supabase DB com status enviado_redacao
    const savedRecord = await saveReportToDatabase({
      userId: req.user?.id || 'dev-user',
      locationAddress,
      latitude,
      longitude,
      audioUrl,
      photoUrl,
      transcription,
      userNotes,
      generatedContent
    });

    // Alias properties so both camelCase and snake_case are available to the client
    const responsePayload = {
      ...savedRecord,
      portalArticle: generatedContent.portalArticle,
      portal_article: generatedContent.portalArticle,
      radioScript: generatedContent.radioScript,
      radio_script: generatedContent.radioScript
    };

    // 6. Dispara o envio do e-mail com a matéria e o roteiro para o destinatário informado
    try {
      await sendReportByEmail({
        recipient: destinationEmail,
        locationAddress,
        transcription,
        userNotes,
        audioUrl,
        photoUrl,
        generatedContent
      });
    } catch (emailErr) {
      console.error('[Report Controller] Falha no disparo de e-mail:', emailErr);
    }

    return res.status(201).json({
      message: 'Reportagem enviada à redação e por e-mail com sucesso!',
      report: responsePayload
    });
  } catch (error: any) {
    console.error('[Report Controller Error]:', error);
    return res.status(500).json({
      error: 'Erro interno ao processar a reportagem.',
      details: error?.message || String(error)
    });
  }
}
