import { transcribeWithWhisperCpp } from './whispercpp.js';
import { transcribeWithDeepgram } from './deepgram.js';

export interface ASROptions {
  speakers: number;
  timestamps: boolean;
  confidence: boolean;
  enhanceAudio: boolean;
  notes?: string;
}

export interface ASRResult {
  provider: string;
  text: string;
  segments: Array<{ start: number; end: number; speaker?: string; text: string; confidence?: number }>;
  diarization?: Array<{ start: number; end: number; speaker: string }>;
  wordConfidence?: Array<{ word: string; start: number; end: number; confidence: number; speaker?: string }>;
}

export interface TranscribeArgs {
  filePath: string;
  originalName: string;
  options: ASROptions;
}

export interface ASRProvider {
  transcribe(args: TranscribeArgs): Promise<ASRResult>;
}

export function chooseASR(): ASRProvider {
  if (process.env.WHISPER_CPP_BIN) return { transcribe: transcribeWithWhisperCpp };
  if (process.env.DEEPGRAM_API_KEY) return { transcribe: transcribeWithDeepgram };
  // Fallback mock to keep development flowing.
  return {
    async transcribe({ filePath }): Promise<ASRResult> {
      return {
        provider: 'mock',
        text: 'This is a mock transcript. Configure WHISPER_CPP_BIN or DEEPGRAM_API_KEY.',
        segments: [{ start: 0, end: 3, speaker: 'S1', text: 'This is a mock transcript.', confidence: 0.6 }],
      };
    }
  };
}
