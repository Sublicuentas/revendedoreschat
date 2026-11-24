// R202 · Bloques 3D: la capa visual es la última, no cambia lógica y el sonido es original y opcional.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
test('index.html: tema activo y bloques-3d.css/js cargados AL FINAL', () => {
  const h = leer('index.html');
  assert.match(h, /<html lang="es" class="b3d">/);
  const css = [...h.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => m[1]);
  const ic = css.findIndex((x) => /^assets\/bloques-3d\.css\?v=/.test(x));
  assert.ok(ic >= 0 && css.slice(ic + 1).every((x) => /^assets\/bloques-(ficha-compras|catalogo)\.css\?v=/.test(x)), 'bloques-3d.css al final; solo la capa R208 va luego');
  const js = [...h.matchAll(/<script src="([^"]+)" defer><\/script>/g)].map((m) => m[1]);
  const ib = js.findIndex((x) => /^assets\/bloques-3d\.js\?v=/.test(x)), ig = js.findIndex((x) => /^assets\/socios-guia\.js\?v=/.test(x));
  assert.ok(ib > ig && js.slice(ib + 1).every((x) => /^assets\/(sublipoints|billetera|bloques-ficha-compras|bloques-catalogo|admin-inicio|campana-avisos)\.js\?v=/.test(x)), 'bloques-3d.js después de todo lo anterior; solo SubliPoints, Billetera y la capa R208 van luego');
});
test('colores del sistema y sin marcas ajenas', () => {
  const c = leer('assets/bloques-3d.css'), j = leer('assets/bloques-3d.js');
  for (const hex of ['#DE1F25', '#148DE1', '#F8BA15', '#17A052', '#783ED2', '#102444', '#F5F7FC', '#DBE3EF']) assert.ok(c.includes(hex), hex);
  assert.doesNotMatch(c + j, /lego|nintendo|mario/i);
});
test('sonido: apagado por defecto, sin archivos de audio, solo tras un toque', () => {
  const j = leer('assets/bloques-3d.js');
  assert.match(j, /localStorage\.getItem\(CLAVE\) === '1'/, 'sin preferencia guardada = apagado');
  assert.doesNotMatch(j, /\.(mp3|wav|ogg)\b|new Audio\(/);
  assert.match(j, /if \(!encendido\(\) \|\| !gesto/);
});
test('la capa visual no toca la lógica (sin llamadas nuevas a la API ni cambios de datos)', () => {
  const j = leer('assets/bloques-3d.js');
  assert.doesNotMatch(j, /fetch\(|XMLHttpRequest|localStorage\.(removeItem|clear)/);
  assert.match(j, /return r;/, 'API.call devuelve la misma respuesta');
});
