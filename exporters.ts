import fs from 'fs';
import path from 'path';
import { Document, Packer, Paragraph, TextRun } from 'docx';

export async function exportTXT({ exportDir, title, text }: { exportDir: string; title: string; text: string }) {
  const out = path.join(exportDir, `${title}.txt`);
  await fs.promises.writeFile(out, text, 'utf8');
  return `/exports/${path.basename(out)}`;
}

export async function exportDOCX({ exportDir, title, text }: { exportDir: string; title: string; text: string }) {
  const doc = new Document({
    sections: [{
      properties: {},
      children: text.split(/\n+/).map((line) => new Paragraph({ children: [new TextRun(line)] })),
    }],
  });
  const buffer = await Packer.toBuffer(doc);
  const out = path.join(exportDir, `${title}.docx`);
  await fs.promises.writeFile(out, buffer);
  return `/exports/${path.basename(out)}`;
}
