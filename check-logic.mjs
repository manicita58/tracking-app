/* Verifica la lógica pura de index.html (bloque LOGIC): lunes de la semana en
   Bogotá, avance automático de semanas, tope de reps de un esquema y la
   migración de registros del gym al split Torso A / Pierna / Torso B.
   Uso: node check-logic.mjs */
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('index.html', import.meta.url), 'utf8');
const m = html.match(/\/\*LOGIC_START\*\/([\s\S]*?)\/\*LOGIC_END\*\//);
if (!m) { console.error('FALLO: no hay bloque LOGIC en index.html'); process.exit(1); }
const { mondayISO, advanceWeeks, repTop, REMAP_LIFTS, remapLifts } =
  new Function(m[1] + '; return {mondayISO, advanceWeeks, repTop, REMAP_LIFTS, remapLifts};')();

// Lunes de la semana, en hora de Bogotá (UTC-5).
assert.equal(mondayISO(Date.parse('2026-11-19T17:00:00Z')), '2026-11-16');   // jueves mediodía
assert.equal(mondayISO(Date.parse('2026-11-23T04:30:00Z')), '2026-11-16');   // domingo 23:30
assert.equal(mondayISO(Date.parse('2026-11-23T05:30:00Z')), '2026-11-23');   // lunes 00:30

// Avance de semanas: la primera vez solo ancla; después suma semanas enteras.
const s = { week: 13, engWeek: 1, monday: null };
assert.equal(advanceWeeks(s, '2026-11-16'), true);
assert.deepEqual(s, { week: 13, engWeek: 1, monday: '2026-11-16' });
assert.equal(advanceWeeks(s, '2026-11-16'), false);
assert.equal(advanceWeeks(s, '2026-11-23'), true);
assert.deepEqual(s, { week: 14, engWeek: 2, monday: '2026-11-23' });
assert.equal(advanceWeeks(s, '2026-12-07'), true);
assert.deepEqual(s, { week: 16, engWeek: 4, monday: '2026-12-07' });
assert.equal(advanceWeeks(s, '2026-11-30'), false);           // reloj atrás: no retrocede
assert.equal(s.week, 16);

// Tope de reps totales de un esquema.
assert.equal(repTop('4 × 8–10 · 2–3 min'), 40);
assert.equal(repTop('3 × 8–10 por pierna'), 60);
assert.equal(repTop('3 × 20 · superserie'), 60);
assert.equal(repTop('3 × 12–15 · 60 s'), 45);
assert.equal(repTop('sin esquema'), 0);

// Migración: las 21 claves viejas, ningún valor perdido, sin colisiones.
const old = [];
for (const d of ['pull', 'legs', 'push']) for (let i = 0; i < 7; i++) old.push(`gym-${d}-${i}`);
assert.deepEqual(Object.keys(REMAP_LIFTS).sort(), old.sort());
const targets = Object.values(REMAP_LIFTS);
assert.equal(new Set(targets).size, targets.length, 'dos claves viejas caen en la misma nueva');

const lifts = Object.fromEntries(old.map((k, i) => [k, { kg: String(i), reps: '36' }]));
const st = { log: { w12d1: { lifts: { ...lifts, otra: { kg: '1', reps: '1' } } }, w12d6: { done: {} } },
             chartLift: 'gym-push-0' };
remapLifts(st);
const after = st.log.w12d1.lifts;
assert.equal(Object.keys(after).length, old.length + 1);
for (const k of old) assert.deepEqual(after[REMAP_LIFTS[k]], lifts[k], k);
assert.deepEqual(after.otra, { kg: '1', reps: '1' });          // fuera de la tabla: intacta
assert.equal(after['gym-pull-0'].kg, lifts['gym-push-0'].kg);  // incline pasa al lunes
assert.equal(after['gym-push-0'].kg, lifts['gym-pull-1'].kg);  // jalón pasa al viernes
assert.ok(after['x-gym-pull-2']);                               // pullover archivado
assert.equal(st.chartLift, 'gym-pull-0');

console.log('OK: lunes, avance de semanas, tope de reps y migración del gym.');
