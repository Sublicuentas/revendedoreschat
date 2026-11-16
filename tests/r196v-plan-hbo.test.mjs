// R196v · Panel de Socios: la tarjeta del producto dice el plan HBO (Standard 3 / Platinum 5) y si es cuenta completa.
// Se prueban las funciones reales del archivo (sin servidor). Datos ficticios.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const src = fs.readFileSync(new URL('../assets/socios-2026.js', import.meta.url), 'utf8');
const pick = (re) => { const m = src.match(re); assert.ok(m, 'no encontré ' + re); return m[0]; };
const code = [pick(/function sxNorm\(v\) \{[^\n]*\}/), pick(/const SX_MODALIDAD_TXT = [^\n]*;/), pick(/function sxPlanHbo\(p\) \{[\s\S]*?\n\}/), pick(/function sxModalidadTxt\(p\) \{[\s\S]*?\n\}/)].join('\n');
const { sxModalidadTxt } = new Function(code + '\nreturn { sxModalidadTxt };')();

test('tarjeta: HBO Platinum / Standard por perfil y cuenta completa', () => {
  assert.equal(sxModalidadTxt({ base: 'HBO Max Platino', modalidad: 'perfil', pideDispositivo: true }), 'HBO Platinum · 5 perfiles por cuenta');
  assert.equal(sxModalidadTxt({ base: 'HBO Standard', modalidad: 'perfil' }), 'HBO Standard · 3 perfiles por cuenta');
  assert.equal(sxModalidadTxt({ base: 'HBO Max Platino', modalidad: 'cuenta_completa' }), 'HBO Platinum · cuenta completa');
});
test('producto «HBO Max» sin plan en el nombre: no se adivina; otras plataformas igual que antes', () => {
  assert.equal(sxModalidadTxt({ base: 'HBO Max', modalidad: 'perfil', pideDispositivo: true }), 'Perfil · pide dispositivo');
  assert.equal(sxModalidadTxt({ base: 'Netflix Platinum', modalidad: 'perfil' }), 'Perfil');
});
