// engine 60 (her 2.11 18:02: on her own page a question showed "<b>Something came…?</b>" as text — «мне это окей, но не хотелось бы, чтобы у
// студентов то же самое было»): every screen of every homework page (b2, c1, me) and every screen of every lesson / revision page in tools
// shows no HTML tag or escaped entity as text. Homework: every task, every step, with the answers opened. Tools: every block of every stage.
//   node tests/no_raw_tags_check.js SITE_DIR
const {chromium} = require('playwright'); const path = require('path'); const fs = require('fs'); const glob = d => fs.existsSync(d) ? fs.readdirSync(d) : [];
const RAW = /<\/?(b|i|s|u|em|strong|span|br|p|div|g|m[123])\b[^>]*>|&lt;|&gt;|&amp;[a-z]+;|&quot;/i;
(async () => {
  const site = path.resolve(process.argv[2]), fail = [], seen = {pages: 0, screens: 0};
  const b = await chromium.launch(); const ctx = await b.newContext({viewport: {width: 1280, height: 900}, reducedMotion: 'reduce'});
  await ctx.addInitScript(() => { ['ttt', 'dots', 'goose', 'snakes'].forEach(k => localStorage.setItem('tool-demo-' + k, '1')); });
  await ctx.route(/youtube\.com|script\.google\.com/, r => r.fulfill({status: 200, contentType: 'text/javascript', body: ''}));
  const p = await ctx.newPage(); p.setDefaultTimeout(8000);
  const look = async where => { const t = await p.evaluate(() => { document.querySelectorAll('.chunk, .reveal').forEach(c => c.classList.add('open')); return document.body.innerText; });
    seen.screens++; const m = t.match(RAW); if (m) fail.push(`${where}: "${t.slice(Math.max(0, m.index - 40), m.index + 40).replace(/\s+/g, ' ')}"`); };
  // homework pages
  for (const g of ['b2', 'c1', 'me']) for (const f of glob(path.join(site, g)).filter(f => /\.html$/.test(f) && f !== 'index.html')) {
    await p.goto('file://' + path.join(site, g, f)); await p.waitForTimeout(250); seen.pages++;
    await look(`${g}/${f} home`);
    const ids = await p.evaluate(() => TASKS.map(t => t.id));
    for (const id of ids) {
      await p.evaluate(id => openTask(id), id).catch(() => {}); await p.waitForTimeout(80);
      for (let k = 0; k < 60; k++) {
        if (await p.locator('.lesson-head').count()) break;
        await look(`${g}/${f} ${id} #${k}`);
        const go = p.locator('#go, #fin').first(); if (!(await go.count()) || await go.isDisabled()) break;
        await go.click().catch(() => {}); await p.waitForTimeout(40);
        if (await p.locator('#go').count() && /Check|Show/.test(await p.locator('#go').innerText().catch(() => ''))) { await look(`${g}/${f} ${id} #${k} checked`); await p.locator('#go').click().catch(() => {}); await p.waitForTimeout(40); }
      }
      await p.evaluate(() => { try{ goHome(); }catch(e){} }); await p.waitForTimeout(40);
    }
  }
  // lesson / revision pages in tools (the plain versions)
  for (const l of glob(path.join(site, 'tools')).filter(d => fs.statSync(path.join(site, 'tools', d)).isDirectory()))
    for (const f of glob(path.join(site, 'tools', l)).filter(f => /\.html$/.test(f) && !/-live\.html$/.test(f))) {
      await p.goto('file://' + path.join(site, 'tools', l, f)); await p.waitForTimeout(250); seen.pages++;
      const field = await p.evaluate(() => typeof D !== 'undefined' && Array.isArray(D.stages) && typeof render === 'function' && typeof S !== 'undefined');
      if (!field) { await look(`tools/${l}/${f}`); continue; }
      const n = await p.evaluate(() => D.stages.map(s => s.blocks.length));
      for (let si = 0; si < n.length; si++) for (let bi = 0; bi < n[si]; bi++) {
        await p.evaluate(([si, bi]) => { S.stage = si; S.intro = false; S.view = 'field'; S.at[si] = bi; render(); }, [si, bi]); await p.waitForTimeout(60);
        await look(`tools/${l}/${f} stage ${si} block ${bi}`);
        await p.evaluate(() => { try{ stepNext(); }catch(e){} }); await p.waitForTimeout(60); await look(`tools/${l}/${f} stage ${si} block ${bi} next`);
      }
    }
  console.log(JSON.stringify(seen));
  console.log(fail.length ? 'FAILED:\n' + fail.slice(0, 40).join('\n') : 'OK no raw tags'); await b.close(); process.exit(fail.length ? 1 : 0);
})();
