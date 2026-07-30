/* Verifica que el mapa muscular de index.html cubra exactamente la rutina de
   plan.json: cada ejercicio del gym tiene músculos asignados, no hay entradas
   huérfanas (ejercicios renombrados), y cada músculo tiene forma en el SVG.
   Uso: node check-muscles.mjs */
import { readFileSync } from 'node:fs';

const plan = JSON.parse(readFileSync('plan.json', 'utf8'));
const html = readFileSync('index.html', 'utf8');

const m = html.match(/\/\*MUSCLE_DATA_START\*\/([\s\S]*?)\/\*MUSCLE_DATA_END\*\//);
if (!m) { console.error('FALLO: no hay bloque MUSCLE_DATA en index.html'); process.exit(1); }
const { MUSCLES, MUSCLE_MAP, BODY_FRONT, BODY_BACK } =
  new Function(m[1] + '; return {MUSCLES, MUSCLE_MAP, BODY_FRONT, BODY_BACK};')();

const errores = [];
const nombres = new Set();
for (const dia of Object.values(plan.GYM))
  for (const [nombre, detalle] of dia.ex) {
    nombres.add(nombre);
    if (!MUSCLE_MAP[nombre]) errores.push(`sin músculos: "${nombre}"`);
    if (!(parseInt(detalle) >= 1)) errores.push(`sets ilegibles en "${nombre}": "${detalle}"`);
  }

for (const [nombre, mm] of Object.entries(MUSCLE_MAP)) {
  if (!nombres.has(nombre)) errores.push(`entrada huérfana (¿renombrado?): "${nombre}"`);
  for (const [k, w] of Object.entries(mm)) {
    if (!MUSCLES[k]) errores.push(`músculo desconocido "${k}" en "${nombre}"`);
    if (!(w > 0 && w <= 1)) errores.push(`peso fuera de (0,1] en "${nombre}.${k}": ${w}`);
  }
}

const conForma = new Set([...BODY_FRONT.mus, ...BODY_BACK.mus].map(s => s.m));
for (const k of Object.keys(MUSCLES))
  if (!conForma.has(k)) errores.push(`músculo sin forma en el SVG: "${k}"`);
for (const k of conForma)
  if (!MUSCLES[k]) errores.push(`forma con músculo desconocido: "${k}"`);

if (errores.length) { errores.forEach(e => console.error('FALLO:', e)); process.exit(1); }
console.log(`OK: ${nombres.size} ejercicios, ${Object.keys(MUSCLES).length} músculos, todo cuadra.`);
