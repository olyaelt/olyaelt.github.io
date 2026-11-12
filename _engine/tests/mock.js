// A tiny stand-in for Google Sheets, enough to run Code.gs in Node.
const fs = require("fs"), vm = require("vm");

class Sheet {
  constructor(name) { this.name = name; this.d = []; this.hidden = false; }
  getName() { return this.name; }
  deleteRow(r) { this.d.splice(r - 1, 1); }   /* tools 33 */
  getLastRow() { for (let r = this.d.length; r > 0; r--) if ((this.d[r-1]||[]).some(v => v !== "" && v != null)) return r; return 0; }
  getLastColumn() { let m = 0; this.d.forEach(row => { for (let c = row.length; c > 0; c--) if (row[c-1] !== "" && row[c-1] != null) { m = Math.max(m, c); break; } }); return m; }
  get(r, c) { return (this.d[r-1] && this.d[r-1][c-1] != null) ? this.d[r-1][c-1] : ""; }
  set(r, c, v) { while (this.d.length < r) this.d.push([]); const row = this.d[r-1]; while (row.length < c) row.push(""); row[c-1] = v; }
  getRange(r, c, nr = 1, nc = 1) {
    if (r < 1 || c < 1 || nr < 1 || nc < 1) throw new Error(`bad range ${r},${c},${nr},${nc}`);
    const sh = this;
    const R = {
      getValues: () => Array.from({length: nr}, (_, i) => Array.from({length: nc}, (_, j) => sh.get(r+i, c+j))),
      getValue: () => sh.get(r, c),
      setValues: (v) => { if (v.length !== nr || v.some(x => x.length !== nc)) throw new Error(`setValues size mismatch ${v.length}x${v[0]&&v[0].length} vs ${nr}x${nc}`); v.forEach((row, i) => row.forEach((x, j) => sh.set(r+i, c+j, typeof x === 'string' && x[0] === "'" ? x.slice(1) : x))); return R; },   // a leading ' keeps a cell text in Sheets and is not stored
      setValue: (v) => { sh.set(r, c, v); if (sh.rich) delete sh.rich[r+","+c]; return R; },
      getRichTextValues: () => Array.from({length: nr}, (_, i) => Array.from({length: nc}, (_, j) => {
        const runs = (sh.rich && sh.rich[(r+i)+","+(c+j)]) || [{text: String(sh.get(r+i, c+j))}];
        return { getRuns: () => runs.map(x => ({ getText: () => x.text, getTextStyle: () => ({ isBold: () => !!x.bold, isStrikethrough: () => !!x.strike, getForegroundColor: () => x.color || null }) })) };
      })),
    };
    ["setFontWeight","setBackground","setWrap","setFontSize","setVerticalAlignment","setFontColor"].forEach(m => R[m] = () => R);
    return R;
  }
  appendRow(a) { const r = this.getLastRow() + 1; a.forEach((v, j) => this.set(r, j+1, v)); }
  getMaxColumns() { return Math.max(26, ...this.d.map(r => r.length)); }   // a new Google sheet has 26 columns (engine 76: Attempts needs 27)
  insertColumnsAfter(col, n) { this.d.forEach(row => { while (row.length < col) row.push(""); row.splice(col, 0, ...Array(n).fill("")); }); }
  setFrozenRows() {} setFrozenColumns() {} setColumnWidth() {} hideRows() {} hideColumns() {} hideSheet() { this.hidden = true; }
}

function makeEnv() {
  const sheets = {}, drive = { props: {}, folders: [], files: [], n: 0 };
  const ss = { getSheetByName: n => sheets[n] || null, insertSheet: n => (sheets[n] = new Sheet(n)),
    getSheets: () => Object.values(sheets), deleteSheet: s => { delete sheets[s.name]; } };
  const pad = n => String(n).padStart(2, "0");
  const ctx = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ss, getUi: () => { throw new Error("no ui"); } },
    LockService: { getScriptLock: () => ({ waitLock() { ctx.locks = (ctx.locks || 0) + 1; }, releaseLock() {} }) },
    /* engine 64: the overview's short cache */
    CacheService: { getScriptCache: () => ({ get: k => (ctx.cache || {})[k] || null, put: (k, v) => { (ctx.cache = ctx.cache || {})[k] = v; }, remove: k => { if (ctx.cache) delete ctx.cache[k]; } }) },
    /* engine 57: her Drive (recordings) */
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => drive.props[k] || null, setProperty: (k, v) => { drive.props[k] = v; } }) },
    DriveApp: (() => { const iter = a => { let i = 0; return { hasNext: () => i < a.length, next: () => a[i++] }; };
      const folder = (name, parent) => { const f = { id: "fold" + (++drive.n), name, parent, kids: [], files: [], getId: () => f.id, getUrl: () => "https://drive.google.com/drive/folders/" + f.id,
        getFoldersByName: n => iter(f.kids.filter(k => k.name === n)), createFolder: n => { const k = folder(n, f); f.kids.push(k); return k; },
        getParents: () => iter(parent ? [parent] : []),
        createFile: blob => { const file = { id: "file" + (++drive.n), name: blob.name, mime: blob.mime, size: blob.bytes.length, bytes: blob.bytes, folder: f, getId: () => file.id, getUrl: () => "https://drive.google.com/file/d/" + file.id + "/view",
          getParents: () => iter([f]), getBlob: () => ({ getBytes: () => file.bytes, getContentType: () => file.mime }) }; f.files.push(file); drive.files.push(file); return file; } };
        drive.folders.push(f); return f; };
      return { getFoldersByName: n => iter(drive.folders.filter(f => !f.parent && f.name === n)), createFolder: n => folder(n, null),
        getFolderById: id => { const f = drive.folders.find(x => x.id === id); if (!f) throw new Error("no folder"); return f; },
        getFileById: id => { const x = drive.files.find(y => y.id === id); if (!x) throw new Error("no file"); return x; } }; })(),
    ContentService: { MimeType: { JSON: "json" }, createTextOutput: s => ({ s, setMimeType() { return this; } }) },
    Utilities: { formatDate: (d, tz, f) => f.replace("yyyy", d.getFullYear()).replace("dd", pad(d.getDate())).replace("MM", pad(d.getMonth()+1)).replace("HH", pad(d.getHours())).replace("mm", pad(d.getMinutes())),
      base64Decode: b => Array.from(Buffer.from(String(b), "base64")), base64Encode: a => Buffer.from(a).toString("base64"), newBlob: (bytes, mime, name) => ({ bytes, mime, name }) },
    Logger: { log(m) { ctx.alerts.push(m); } },
    console, Math, Date, JSON, String, Number, Object, Array, isFinite, alerts: [],
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(__dirname + "/../Code.gs", "utf8"), ctx);
  return {
    sheets, ctx, drive,
    post: body => JSON.parse(ctx.doPost({ postData: { contents: body } }).s),
    get: () => JSON.parse(ctx.doGet({}).s),
  };
}
module.exports = { makeEnv };
