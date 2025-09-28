import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';

if (process.env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
}

export async function transcodeToWavMono16k(inputPath: string): Promise<string> {
  const outPath = path.join(path.dirname(inputPath), path.basename(inputPath) + '.wav');
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFrequency(16000)
      .audioChannels(1)
      .format('wav')
      .on('error', reject)
      .on('end', () => resolve(outPath))
      .save(outPath);
  });
}
