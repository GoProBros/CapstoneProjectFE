const fs = require('fs');
const path = 'd:\\University\\Semester\\Semester9\\CapstoneProject\\_plans\\PLAN.md';
const raw = fs.readFileSync(path);
const mojibake = raw.toString('utf8');
const buf = Buffer.from(mojibake, 'latin1');
const correct = buf.toString('utf8');
fs.writeFileSync(path, correct, { encoding: 'utf8' });
console.log('Done, length:', correct.length);
console.log('First 100 chars:', correct.substring(0, 100));
