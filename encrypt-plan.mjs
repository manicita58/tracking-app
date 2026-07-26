/* Cifra plan.json y lo inyecta en index.html como PLAN_ENC.
   Uso:  PASS='tu-frase' node encrypt-plan.mjs
   plan.json nunca se sube al repo (está en .gitignore); solo viaja el cifrado. */
import fs from 'fs';
import { webcrypto as crypto } from 'node:crypto';

const PASS = process.env.PASS;
if (!PASS) { console.error('Falta PASS. Uso: PASS=\'tu-frase\' node encrypt-plan.mjs'); process.exit(1); }

const ITER = 600000;   // OWASP para PBKDF2-SHA256
const here = new URL('.', import.meta.url).pathname;

const plain = fs.readFileSync(here + 'plan.json');
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));

const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(PASS), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' },
  base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']
);
const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain));

// salt(16) || iv(12) || ciphertext  →  base64
const blob = new Uint8Array(salt.length + iv.length + ct.length);
blob.set(salt, 0); blob.set(iv, salt.length); blob.set(ct, salt.length + iv.length);
const b64 = Buffer.from(blob).toString('base64');

const file = here + 'index.html';
const html = fs.readFileSync(file, 'utf8');
const next = html.replace(/const PLAN_ENC='[^']*';/, `const PLAN_ENC='${b64}';`);
if (next === html) { console.error('No encontré el marcador PLAN_ENC en index.html'); process.exit(1); }
fs.writeFileSync(file, next);

console.log(`plan.json ${plain.length} bytes → cifrado ${b64.length} chars, inyectado en index.html`);
