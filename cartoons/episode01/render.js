// Рендер кадров через Chromium -> ffmpeg. node render.js [--preview t1,t2,...] [--from s --to s]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const B = path.join(__dirname, 'build');
const TL = JSON.parse(fs.readFileSync(path.join(B, 'timeline.json'), 'utf8'));
const args = process.argv.slice(2);
const arg = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };

async function page(browser) {
  const p = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.setContent(`<html><head><style>body{margin:0;background:#000}</style></head><body><div id="v"></div></body></html>`);
  await p.addScriptTag({ content: `window.TL=${JSON.stringify(TL)};` });
  await p.addScriptTag({ path: path.join(B, 'assets.js') });
  await p.addScriptTag({ path: path.join(__dirname, 'scenes.js') });
  await p.evaluate(() => document.fonts.ready);
  return p;
}
async function shot(p, t, type = 'jpeg') {
  await p.evaluate(t => { document.getElementById('v').innerHTML = renderFrame(t); }, t);
  return p.screenshot({ type, quality: 92, clip: { x: 0, y: 0, width: 1080, height: 1920 } });
}

(async () => {
  const browser = await chromium.launch();
  if (arg('--preview')) {
    const p = await page(browser);
    fs.mkdirSync(path.join(B, 'preview'), { recursive: true });
    for (const t of arg('--preview').split(',').map(Number)) {
      fs.writeFileSync(path.join(B, 'preview', `t${t.toFixed(2)}.jpg`), await shot(p, t));
    }
    await browser.close(); return;
  }
  const fps = TL.fps, total = Math.ceil(TL.duration * fps);
  const workers = +(arg('--workers') || 4);
  const per = Math.ceil(total / workers);
  const t0 = Date.now();
  await Promise.all([...Array(workers).keys()].map(async w => {
    const p = await page(browser);
    const a = w * per, b = Math.min(total, a + per);
    const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', path.join(B, `part${w}.mp4`)]);
    for (let i = a; i < b; i++) {
      const buf = await shot(p, i / fps);
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (w === 0 && i % 60 === 0) console.log(`frame ${i}/${b} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    ff.stdin.end();
    await new Promise(r => ff.on('close', r));
  }));
  await browser.close();
  fs.writeFileSync(path.join(B, 'parts.txt'), [...Array(workers).keys()].map(w => `file 'part${w}.mp4'`).join('\n'));
  console.log('rendered in', ((Date.now() - t0) / 1000).toFixed(0), 's');
})();
