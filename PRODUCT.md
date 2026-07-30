# Product

## Register

product — UI de herramienta personal; el diseño sirve a la tarea, no es la tarea.

## Users & Purpose

Un solo usuario (Carlos). PWA offline-first de un solo archivo (`index.html`) para
seguir su sistema personal: triatlón (gimnasio pull/legs/push, trote, nado, bici),
inglés y enfoque diario. Se usa a diario desde el móvil, en sesiones cortas
(marcar sesiones, anotar cargas en libras, revisar progreso semanal).

## Brand & Personality

Sobrio, denso, legible de noche. Tema oscuro fijo (rampa teal OKLCH), una sola
familia tipográfica del sistema, escala fija 1.2. Cada disciplina tiene un color
de identidad (`--gym`, `--run`, `--swim`, `--bike`, `--eng`) que se usa solo para
estado y pertenencia, nunca como decoración.

## Anti-references

Nada de dashboards gamificados con confeti, ni landing-style heros, ni motion
decorativo. Sin dependencias externas: vanilla JS, SVG a mano, cero CDN.

## Strategic design principles

- Todo cabe en 320 px de ancho; los tabs viven fijos abajo.
- El contraste ya está verificado sobre `--surface` (comentado en `:root`); toda
  adición respeta esa rampa.
- `render()` reconstruye vistas completas; los inputs que pierden foco al
  reconstruir se actualizan in situ (patrón ya establecido en View.sessions).
- El plan (datos personales) viaja cifrado en `PLAN_ENC`; la lógica de la app va
  en claro en `index.html`.
