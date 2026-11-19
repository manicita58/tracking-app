/* Verifica la lógica pura de index.html (bloque LOGIC): lunes de la semana en
   Bogotá, avance automático de semanas, tope de reps de un esquema y la
   migración de registros del gym al split Torso A / Pierna / Torso B.
   Uso: node check-logic.mjs */
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('index.html', import.meta.url), 'utf8');
const m = html.match(/\/\*LOGIC_START\*\/([\s\S]*?)\/\*LOGIC_END\*\//);
if (!m) { console.error('FALLO: no hay bloque LOGIC en index.html'); process.exit(1); }
const { mondayISO, advanceWeeks, repTop, REMAP_LIFTS, remapLifts, setsOf, e1rm, liftTrend, weightVerdict } =
  new Function(m[1] + '; return {mondayISO, advanceWeeks, repTop, REMAP_LIFTS, remapLifts, setsOf, e1rm, liftTrend, weightVerdict};')();

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

// Fuerza estimada: peso y reps juntos (Epley sobre las reps de una serie).
assert.equal(setsOf('4 × 8–10 · 2 min'), 4);
assert.equal(setsOf('3 × 8–10 por pierna'), 6);
assert.equal(setsOf('sin esquema'), 1);
assert.ok(Math.abs(e1rm(100, 40, '4 × 8–10') - 400 / 3) < 1e-9);       // 100 × (1 + 10/30)
assert.ok(e1rm(100, 40, '4 × 8–10') > e1rm(100, 36, '4 × 8–10'));     // más reps, mismo peso: sube
assert.equal(e1rm(50, '', '3 × 10–12'), 50);                            // sin reps: solo el peso

// Tendencia por ejercicio.
const flat = liftTrend([1, 2, 3, 4, 5, 6].map(w => ({ w, kg: '100', reps: '36' })), '4 × 8–10');
assert.equal(flat.delta, 0);
assert.equal(flat.stalled, 5);                // el último récord fue en la semana 1
assert.equal(flat.ready, false);              // 36 < 40
const up = liftTrend([{ w: 1, kg: '20', reps: '36' }, { w: 5, kg: '24', reps: '36' }], '4 × 8–10');
assert.ok(up.delta > 0.19 && up.delta < 0.21);
assert.equal(up.stalled, 0);
const ref = liftTrend([{ w: 1, kg: '10', reps: '30' }, { w: 5, kg: '20', reps: '30' }, { w: 9, kg: '22', reps: '30' }], '3 × 10–12');
assert.ok(Math.abs(ref.delta - 0.1) < 1e-9);  // compara contra el nivel de hace 4 semanas (S5), no contra la primera
// Mejor marca de las últimas 4 semanas contra la mejor de las 4 anteriores: una semana
// ligera o con otra máquina en medio no infla el cambio.
const dip = liftTrend([{ w: 1, kg: '24', reps: '36' }, { w: 2, kg: '12', reps: '36' },
                       { w: 5, kg: '24', reps: '36' }, { w: 6, kg: '24', reps: '36' }], '4 × 8–10');
assert.equal(dip.delta, 0);
const fresh = liftTrend([{ w: 12, kg: '20', reps: '30' }, { w: 13, kg: '22', reps: '30' }], '3 × 10–12');
assert.ok(Math.abs(fresh.delta - 0.1) < 1e-9);  // todo dentro de 4 semanas: contra la primera
assert.equal(liftTrend([{ w: 3, kg: '24', reps: '40' }], '4 × 8–10').ready, true);
assert.equal(liftTrend([], '4 × 8–10'), null);

// Veredicto del ritmo de peso (% por semana).
assert.equal(weightVerdict(-0.1)[0], 'warn');
assert.equal(weightVerdict(0.1)[0], '');
assert.equal(weightVerdict(0.3)[0], 'ok');
assert.equal(weightVerdict(0.8)[0], 'warn');

console.log('OK: lunes, avance de semanas, tope de reps, migración, fuerza estimada y peso.');
