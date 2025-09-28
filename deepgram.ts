import fs from 'fs';
import fetch from 'node-fetch';

export async function transcribeWithDeepgram({ filePath, options }: { filePath: string; options: any }) {
  const apiKey = process.env.DEEPGRAM_API_KEY as string;
  if (!apiKey) throw new Error('Missing DEEPGRAM_API_KEY');

  const buffer = await fs.promises.readFile(filePath);

  const params = new URLSearchParams({
    diarize: 'true',
    punctuate: 'true',
    utterances: 'true',
    model: 'nova-2',
  });

  const resp = await fetch(`https://api.deepgram.com/v1/listen?${params.toString()}`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'audio/wav'
    },
    body: buffer
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Deepgram error: ${resp.status} ${text}`);
  }

  const data: any = await resp.json();
  // Parse a simplified output

  const transcript = data.results?.channels?.[0]?.alternatives?.[0];
  const text: string = transcript?.transcript || '';

  const words = (transcript?.words || []).map((w: any) => ({
    word: w.word,
    start: w.start,
    end: w.end,
    confidence: w.confidence,
    speaker: w.speaker || undefined,
  }));

  // Build segments from utterances if available
  const segments = (data.results?.utterances || []).map((u: any) => ({
    start: u.start,
    end: u.end,
    speaker: u.speaker !== undefined ? `S${u.speaker}` : undefined,
    text: u.transcript,
    confidence: u.confidence,
  }));

  // Simple diarization blocks
  const diarization = (data.results?.utterances || []).map((u: any) => ({
    start: u.start,
    end: u.end,
    speaker: u.speaker !== undefined ? `S${u.speaker}` : 'S?',
  }));

  return {
    provider: 'deepgram',
    text,
    segments,
    diarization,
    wordConfidence: words
  };
}
