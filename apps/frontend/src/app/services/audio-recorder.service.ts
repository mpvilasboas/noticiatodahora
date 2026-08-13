import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioRecorderService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  
  isRecording = signal<boolean>(false);
  isPaused = signal<boolean>(false);
  recordingTimeSeconds = signal<number>(0);
  audioBlob = signal<Blob | null>(null);
  audioUrl = signal<string | null>(null);

  private timerInterval: any = null;

  async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(stream);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.audioChunks, { type: mimeType });
        this.audioBlob.set(blob);
        this.audioUrl.set(URL.createObjectURL(blob));
        
        // Stop stream tracks
        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.start(200);
      this.isRecording.set(true);
      this.isPaused.set(false);
      this.recordingTimeSeconds.set(0);

      this.timerInterval = setInterval(() => {
        if (!this.isPaused()) {
          this.recordingTimeSeconds.update(t => t + 1);
        }
      }, 1000);
    } catch (err) {
      console.error('Microphone permission error:', err);
      throw new Error('Não foi possível acessar o microfone do dispositivo.');
    }
  }

  pauseRecording(): void {
    if (this.mediaRecorder && this.isRecording() && !this.isPaused()) {
      this.mediaRecorder.pause();
      this.isPaused.set(true);
    }
  }

  resumeRecording(): void {
    if (this.mediaRecorder && this.isRecording() && this.isPaused()) {
      this.mediaRecorder.resume();
      this.isPaused.set(false);
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.isRecording()) {
      this.mediaRecorder.stop();
      this.isRecording.set(false);
      this.isPaused.set(false);
      clearInterval(this.timerInterval);
    }
  }

  clearRecording(): void {
    this.stopRecording();
    this.audioBlob.set(null);
    if (this.audioUrl()) {
      URL.revokeObjectURL(this.audioUrl()!);
      this.audioUrl.set(null);
    }
    this.recordingTimeSeconds.set(0);
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
