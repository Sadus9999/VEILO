import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pdf } from 'pdf-to-img';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const TMP_PDF = path.join(os.tmpdir(), 'VEILO_TEST.pdf');
const DRIVE_URL = 'https://drive.usercontent.google.com/download?id=1o4T3_VxeAe77I_uxY06uk8byRm1ukaYw&export=download&confirm=t';

async function copyDir(from, to) {
  await fs.mkdir(to, { recursive: true });
  for (const entry of await fs.readdir(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) await copyDir(src, dst);
    else await fs.copyFile(src, dst);
  }
}

async function main() {
  await fs.rm(DIST, { recursive: true, force: true });
  await fs.mkdir(path.join(DIST, 'pages'), { recursive: true });
  await fs.copyFile(path.join(ROOT, 'app', 'index.html'), path.join(DIST, 'index.html'));
  await copyDir(path.join(ROOT, 'assets'), path.join(DIST, 'assets'));

  console.log('Downloading VEILO_TEST.pdf...');
  const response = await fetch(DRIVE_URL, { redirect: 'follow' });
  if (!response.ok) throw new Error(`PDF download failed: ${response.status} ${response.statusText}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 10000 || bytes.subarray(0, 4).toString() !== '%PDF') {
    throw new Error(`Downloaded file does not look like a PDF (${bytes.length} bytes)`);
  }
  await fs.writeFile(TMP_PDF, bytes);
  console.log(`PDF downloaded: ${(bytes.length / 1024).toFixed(1)} KB`);

  const document = await pdf(TMP_PDF, { scale: 2 });
  let page = 1;
  try {
    for await (const image of document) {
      const name = `page-${String(page).padStart(2, '0')}.png`;
      await fs.writeFile(path.join(DIST, 'pages', name), image);
      console.log(`Rendered ${name}`);
      page++;
    }
  } finally {
    await document.destroy();
  }

  const count = page - 1;
  if (count !== 26) throw new Error(`Expected 26 pages, rendered ${count}`);
  console.log('VEILO build complete: 26 static document pages.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
