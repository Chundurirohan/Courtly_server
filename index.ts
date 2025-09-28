import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { sha256File } from './utils/hash.js';
import { transcodeToWavMono16k } from './utils/ffmpeg.js';
import { chooseASR } from './vendors/asr.js';
import { createChainOfCustody } from './utils/coc.js';
import { exportTXT, exportDOCX } from './utils/exporters.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5050;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'uploads');
const EXPORT_DIR = process.env.EXPORT_DIR || path.join(__dirname, '..', 'exports');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(EXPORT_DIR, { recursive: true });

const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: '5mb' }));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, DATA_DIR),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, Date.now() + '_' + safe);
  }
});
const upload = multer({ storage });

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.post('/api/transcribe', upload.array('files'), async (req, res) => {
  try {
    const files = (req.files as Express.Multer.File[]) || [];
    if (!files.length) return res.status(400).json({ error: 'No files uploaded' });

    const options = {
      speakers: parseInt(String(req.body.speakers || '2')),
      timestamps: String(req.body.timestamps) === 'true',
      confidence: String(req.body.confidence) === 'true',
      enhanceAudio: String(req.body.enhanceAudio) === 'true',
      notes: String(req.body.notes || '')
    };

    const provider = chooseASR();

    const results = [];
    for (const f of files) {
      const originalPath = f.path;
      const sha256 = await sha256File(originalPath);

      // Optional enhancement/transcode
      const wavPath = options.enhanceAudio
        ? await transcodeToWavMono16k(originalPath)
        : originalPath;

      const asr = await provider.transcribe({
        filePath: wavPath,
        originalName: f.originalname,
        options
      });

      const coc = await createChainOfCustody({
        exportDir: EXPORT_DIR,
        originalPath,
        processedPath: wavPath,
        sha256Original: sha256,
        provider: asr.provider,
        meta: {
          notes: options.notes || undefined,
        }
      });

      results.push({
        file: f.originalname,
        sha256,
        transcriptText: asr.text,
        segments: asr.segments,
        diarization: asr.diarization || null,
        wordConfidence: asr.wordConfidence || null,
        provider: asr.provider,
        chainOfCustody: coc.filename
      });
    }

    res.json({ ok: true, results });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err?.message || 'Transcription failed' });
  }
});

app.post('/api/export', async (req, res) => {
  try {
    const { format, transcriptText, title } = req.body || {};
    if (!transcriptText || !format) {
      return res.status(400).json({ error: 'Missing format or transcriptText' });
    }
    const safeTitle = (title || 'Courtly_Transcript').replace(/[^a-zA-Z0-9._-]/g, '_');
    if (format === 'txt') {
      const outPath = await exportTXT({ exportDir: EXPORT_DIR, title: safeTitle, text: transcriptText });
      return res.json({ ok: true, path: outPath });
    } else if (format === 'docx') {
      const outPath = await exportDOCX({ exportDir: EXPORT_DIR, title: safeTitle, text: transcriptText });
      return res.json({ ok: true, path: outPath });
    } else {
      return res.status(400).json({ error: 'Unsupported format' });
    }
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err?.message || 'Export failed' });
  }
});

app.use('/exports', express.static(EXPORT_DIR));

app.listen(PORT, () => {
  console.log(`Courtly server listening on http://localhost:${PORT}`);
});
