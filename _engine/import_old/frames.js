const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const out = {};
  await p.route(/^https?:\/\//, r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":false,"error":"offline"}' }));
  for (const f of process.argv.slice(2)) {
    await p.goto('file://' + f); await p.waitForTimeout(200);
    out[await p.evaluate(() => PAGE_KEY)] = await p.evaluate(() => ({ date: LESSON.date, tasks: TASKS.map(t => ({ id: t.id, title: t.title, frames: framesOf(t), min: minutesOf(t) })) }));
  }
  console.log(JSON.stringify(out)); await b.close();
})();
