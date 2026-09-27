const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..') + path.sep;
const html = fs.readFileSync(root + 'index.html', 'utf8');
const re = /<script\s+src="([^"]+)"/g;
let m;
let fails = 0;
const seen = new Set();
while ((m = re.exec(html)) !== null) {
  const src = m[1].split('?')[0];
  if (src.startsWith('http') || seen.has(src)) continue;
  seen.add(src);
  const exists = fs.existsSync(path.join(root, src));
  if (!exists) fails++;
  console.log((exists ? 'ok   ' : 'MISS ') + src);
}
console.log(seen.size + ' scripts verificados');
console.log(fails === 0 ? '\nSCRIPTS OK' : '\n' + fails + ' FALHAS');
process.exit(fails ? 1 : 0);
