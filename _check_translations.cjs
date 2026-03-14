/**
 * Script to generate missing translations for all languages.
 * Reads translations.ts, finds missing keys per language, outputs the additions.
 */
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'constants', 'translations.ts');
const content = fs.readFileSync(file, 'utf8');

// Parse each language block
const langPattern = /\s+(\w{2}):\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g;

function extractKeys(block) {
    const keys = {};
    const lines = block.split('\n');
    for (const line of lines) {
        const m = line.match(/^\s+(\w+):\s*"(.*)"/);
        if (m) keys[m[1]] = m[2];
    }
    return keys;
}

// Extract all language blocks
const langs = {};
let m;
while ((m = langPattern.exec(content)) !== null) {
    langs[m[1]] = extractKeys(m[2]);
}

const enKeys = Object.keys(langs.en || {});
console.log(`EN has ${enKeys.length} keys`);

// Check each language
for (const [code, translations] of Object.entries(langs)) {
    const existing = Object.keys(translations);
    const missing = enKeys.filter(k => !translations[k] && translations[k] !== '');
    console.log(`${code}: ${existing.length} keys, missing ${missing.length}`);
}
