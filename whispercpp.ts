import { spawn } from 'child_process';

export async function transcribeWithWhisperCpp({ filePath }: { filePath: string }) {
  const bin = process.env.WHISPER_CPP_BIN as string;
  const model = process.env.WHISPER_CPP_MODEL || 'ggml-large-v3.bin';
  const args = ['-m', model, '-f', filePath, '-of', 'json', '-pp']; // enable punctuation & timestamps; adjust as needed

  const stdout = await run(bin, args);
  // Note: whisper.cpp JSON schema may vary by build; parse conservatively.
  try {
    const data = JSON.parse(stdout);
    const segments = (data.segments || []).map((s: any) => ({
      start: s.t0 ? s.t0 / 100.0 : s.start || 0,
      end: s.t1 ? s.t1 / 100.0 : s.end || 0,
      text: s.text?.trim() || '',
    }));
    const text = segments.map((s: any) => s.text).join(' ').trim();
    return { provider: 'whisper.cpp', text, segments };
  } catch (e) {
    return { provider: 'whisper.cpp', text: 'Unable to parse whisper.cpp output', segments: [] };
  }
}

function run(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    proc.stdout.on('data', (d) => (out += d.toString()));
    proc.stderr.on('data', (d) => (err += d.toString()));
    proc.on('close', (code) => {
      if (code === 0) resolve(out);
      else reject(new Error(err || `Exited with code ${code}`));
    });
  });
}
