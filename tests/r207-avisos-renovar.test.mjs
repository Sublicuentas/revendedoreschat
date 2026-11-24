// R207 · avisos ordenados (una ventaja por línea) y hoja «Subir comprobante» que sí desliza.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
test('la hoja de Renovar / Subir comprobante desliza (sin overflow:hidden)', () => {
  const css = leer('assets/bloques-3d.css');
  const i = css.indexOf('html.b3d body .cobro-sheet,html.b3d body .quick-sheet,html.b3d body .sx-modal');
  const bloque = css.slice(i, css.indexOf('}', i));
  assert.doesNotMatch(bloque.replace(/\/\*[\s\S]*?\*\//g, ""), /[;{\s]overflow:hidden/); assert.match(bloque, /overflow-y:auto/);
});
test('avisos: cuerpo ordenado sin reescribir el texto guardado', () => {
  const js = leer('assets/socios-guia.js');
  assert.match(js, /function sxgAvOrdenar/); assert.match(js, /\$\{ab \? sxgAvCuerpo\(a\) : ''\}/);
  const src = js.slice(js.indexOf('const SXG_EMO'), js.indexOf('function sxgAvTitulo'));
  const sxEsc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const sxgAvTitulo = (a) => String(a.texto || '').trim().split(/\n/)[0];
  const f = new Function('sxEsc', 'sxgAvTitulo', src + '; return sxgAvCuerpo;')(sxEsc, sxgAvTitulo);
  const h = f({ texto: 'Promo\nHbo · L80\n✅ Perfiles 4K 🔑 Acceso por código 📱 1 dispositivo 👇' });
  assert.equal((h.match(/<li>/g) || []).length, 3); assert.match(h, /sxg-av-precio">Hbo · L80/); assert.doesNotMatch(h, /👇/);
  assert.equal(f({ texto: 'Netflix subió a L110' }), '');
});
