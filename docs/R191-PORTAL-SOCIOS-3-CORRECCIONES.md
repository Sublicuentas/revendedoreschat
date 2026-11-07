# R191 · Portal de Socios — 3 correcciones visuales (PDF 07/11/2026)

Proyecto: **Panel de Socios (revendedoreschat)**. Estado: **listo para staging, NO publicado**. Va encima de R190.

Se trabajó con datos ficticios y API simulada. No se tocaron la APK, el bot, la base de datos, las ventas, las renovaciones, los cinco botones del menú inferior ni las categorías de Más.

## Archivos

| Archivo | Cambio |
|---|---|
| `assets/socios-guia.js` | Saludo y avatar desde el Perfil real; el filtro elegido queda a la vista; con el teclado abierto se ocultan la barra de compra y el menú. |
| `assets/socios-guia.css` | Filtros en una sola fila deslizante y barra de Compras compacta. |
| `index.html`, `service-worker.js` | Solo la versión del archivo (`r191`), para que los teléfonos bajen la nueva. |
| `tests/socios-guia-r185.e2e.mjs` | 5 casos nuevos R191; R185-04 y R190-01/03 ajustados a la regla nueva. |

## 1 · Foto y «Hola, [nombre]»

**Causa:** las capturas eran de la cuenta de socio «Sublicuentas», abierta desde Admin. En R190 el nombre «Sublicuentas» se descartaba como si fuera el administrador. Sin nombre, la cabecera mostraba el ícono genérico.

**Ahora:**

- Se respeta siempre el nombre visible guardado en Mi perfil. Si no hay, se usa el nombre de la cuenta.
- La cabecera muestra **la misma imagen que Mi perfil**:
  - la foto guardada;
  - si no hay foto guardada, la imagen de perfil que ya muestra esa pantalla.
  - Si la imagen no carga, se ven las iniciales. Nunca el ícono genérico ni el punto rojo.
- Cambiar la foto o el nombre en Mi perfil se ve al instante en la cabecera y en el saludo, sin recargar.
- Al tocar el avatar se abre Mi perfil.

## 2 · Filtros de Clientes

- Los cinco filtros van en **una sola fila deslizante**: Todos · Vigentes · Renovaciones · Vencidos · Sin servicio.
  - Cada uno con su texto completo y su contador.
  - Debajo dice «Deslice para ver más filtros →» en celular.
- Al tocar un filtro, ese queda a la vista en la fila.
- La lógica de filtrado, los contadores y la búsqueda no cambiaron. Renovaciones sigue siendo parte de Vigentes; los conteos no se suman.

## 3 · Compras / Continuar

- La barra queda en **un solo renglón**, «N servicios · Total L…» a la izquierda y **Continuar** de 42 px a la derecha.
  - Va encima del menú inferior y no tapa el último producto.
  - Respeta el área segura del teléfono.
- Continuar sigue **deshabilitado** con el carrito vacío.
- El flujo no cambió: Productos → Cliente → Pago, un pedido por cliente, mismos precios y descuentos, mismo carrito, comprobante e historial.
- **Con el teclado abierto** se ocultan la barra y el menú para no tapar el campo.
  - Vuelven al cerrar el teclado.
  - Con teclado físico no se oculta nada.

## Pruebas (Playwright, datos ficticios)

| Suite | Resultado |
|---|---|
| `socios-guia-r185.e2e.mjs` | **21/21** (R185 + R190 + R191) |
| `socios-rediseno.e2e.mjs` (regresión: compra completa, entregas, Buzón, Perfil, Telegram) | **15/15** |

Qué cubren los casos nuevos de R191:

- **R191-01/02:** «Hola, Sublicuentas» con la misma imagen que Mi perfil; otro socio («Yami») ve su nombre y su foto.
- **R191-03:** cambiar foto o nombre se ve en la cabecera sin recargar.
- **R191-05/06:** en 320, 360 y 390 px, los 5 filtros en una fila, sin desborde. Cada filtro cuadra con su contador y queda a la vista.
- **R191-07/08/09:**
  - con el carrito vacío, la barra dice «0 servicios · Total L0» y Continuar (40–44 px) está deshabilitado;
  - con 1 producto se habilita y pasa a Cliente;
  - no se registró ningún pedido.
- **R191-10/11:** con el teclado abierto se ocultan la barra y el menú; Mis pedidos conserva su historial.

**Pendiente en el teléfono real:**

- Entrar con la cuenta de Yami y con «Sublicuentas».
- Revisar los filtros en 320–390 px.
- Abrir el teclado en Compras.

## Rollback

Volver a subir `assets/socios-guia.js`, `assets/socios-guia.css`, `index.html` y `service-worker.js` de R190 (zip 77).
