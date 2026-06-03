// Deep-merges scripts/_add.json into each messages/<locale>.json.
// _add.json shape: { "ru": {nested}, "uz": {nested}, "en": {nested}, "kz": {nested} }
const fs = require('fs');
const path = require('path');

const add = JSON.parse(fs.readFileSync(path.join(__dirname, '_add.json'), 'utf8'));

function deepMerge(target, src) {
  for (const k of Object.keys(src)) {
    if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k])) {
      if (!target[k] || typeof target[k] !== 'object') target[k] = {};
      deepMerge(target[k], src[k]);
    } else {
      target[k] = src[k];
    }
  }
  return target;
}

for (const locale of Object.keys(add)) {
  const file = path.join(__dirname, '..', 'messages', `${locale}.json`);
  const cur = JSON.parse(fs.readFileSync(file, 'utf8'));
  deepMerge(cur, add[locale]);
  fs.writeFileSync(file, JSON.stringify(cur, null, 2) + '\n', 'utf8');
  console.log('merged ->', locale);
}
