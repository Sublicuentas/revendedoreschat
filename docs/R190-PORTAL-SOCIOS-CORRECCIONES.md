# R190 · Portal de Socios — correcciones finales de Inicio, perfil y Compras (PDF 07/11/2026)

Proyecto: **Panel de Socios (revendedoreschat)**. Estado: **listo para staging, NO publicado**.

Se trabajó con datos ficticios y API simulada. No se crearon pedidos ni se tocaron datos reales, Control Maestro, CRM, APK, Telegram, catálogo, pagos, permisos ni rutas fuera de este módulo.

## Archivos

| Archivo | Cambio |
|---|---|
| `assets/socios-guia.js` | Saludo con nombre, avatar real, sin ☰ ni panel, sin «Metas del mes» en Inicio, Compras = tienda, «Mis pedidos» secundario. |
| `assets/socios-guia.css` | Avatar sobrio (foto o iniciales), enlace «Mis pedidos», botones 3D suaves y `prefers-reduced-motion`. |
| `index.html`, `service-worker.js` | Solo la versión del archivo (`r190`), para que los teléfonos bajen la nueva y no se queden con la anterior en caché. |
| `tests/socios-guia-r185.e2e.mjs` | Nuevos casos R190; casos R185 ajustados a lo nuevo. |
| `tests/socios-rediseno.e2e.mjs` | Ajustes por quitar el menú y por Compras = tienda. |

## Lo que se corrigió

1. **«Hola, [primer nombre]».** El nombre sale de la sesión autenticada, en este orden:
   1. Nombre visible del Perfil (servidor).
   2. Lo que devuelve `/rev/me` o el login.
   3. El token de sesión que emitió el servidor.
   - Solo se usa para mostrar; los permisos no salen de aquí.
   - Si el nombre es compuesto, se usa el primero («Yami Valladares» → «Hola, Yami»).
   - Mientras carga se ve un esqueleto. «Hola» a secas solo aparece si el perfil de verdad no tiene nombre.
   - **Causas encontradas:**
     - El login descartaba `nombreMostrar`.
     - Inicio no se repintaba cuando llegaba el perfil: solo se actualizaba el saludo viejo, que ya no se ve.
     - Por eso una sesión guardada sin nombre se quedaba en «Hola».
   - La prueba R190-01 reproduce ese caso con una sesión sin nombre: primero sale el esqueleto y luego «Hola, Yami».
2. **Avatar arriba a la derecha.**
   - Muestra la foto del Perfil, o las iniciales si no hay foto («YV», «JL»). Si no hay nombre, un ícono de persona; **nunca** el punto rojo.
   - Al tocarlo abre Mi perfil.
   - La campana se conserva igual.
3. **Menú de tres rayas eliminado**, junto con su panel vacío, la superposición y sus eventos.
   - Lo que tenía («Actualizar datos», «Instalar aplicación», «Salir») quedó como acciones dentro de **Más**, sin categorías nuevas.
   - Las novedades siguen en la campanita.
4. **«Metas del mes» ya no aparece en Inicio.**
   - Los datos y la pantalla de metas no se borraron: se llega tocando «Mis ventas».
5. **Compras (barra inferior) abre la tienda y el carrito.** Es la misma «Nueva compra» de siempre:
   - productos → cliente → pago;
   - un pedido = un cliente;
   - comprobante y operación idempotente, como ya funcionaban.
   - La portada dice «Compras · Seleccione aplicaciones y planes» y tiene **«Mis pedidos ›»** arriba a la derecha.
6. **«Mis pedidos»** es el historial anterior, intacto: Todos/Entregados, buscador, detalle con línea de tiempo y datos de entregas.
   - «← Compras» vuelve a la tienda **con el carrito como estaba**.
   - La pestaña de abajo sigue marcada en Compras.
   - El enlace directo al historial sigue funcionando.
7. **Socio sin permiso de compra:** no ve Compras, igual que antes.
8. **Barra:** sigue exacta: Inicio · Clientes · Compras · Catálogo · Más.

## Pruebas (Playwright, datos ficticios)

| Suite | Resultado | Qué cubre |
|---|---|---|
| `socios-guia-r185.e2e.mjs` | **16/16** | 11 de R185 y 5 nuevas de R190 (PDF 01–14). |
| `socios-rediseno.e2e.mjs` (regresión) | **15/15** | Clientes, Catálogo, Más, Buzón, Renovaciones, compra completa, entregas, Perfil y Telegram. |

Detalle de las nuevas R190:

- **R190-01/02:** «Hola, Yami» y «Hola, Carlos» según quién entra; sesión sin nombre → esqueleto → nombre.
- **R190-03/04:** foto real arriba a la derecha y al tocar abre Perfil; sin foto, iniciales, nunca «·».
- **R190-05/06:** sin ☰ ni panel, sin Metas, barra exacta, Más sin categorías nuevas.
- **R190-07 a 11:** Compras abre la tienda; 2 aplicaciones en el carrito; Mis pedidos con el historial sin tocar; al volver, el carrito sigue.
- **R190-13:** escritorio 1440 y teléfonos de 320/360/430 px sin desplazamiento horizontal.

Las capturas de móvil y escritorio van en el zip 78.

**Pendiente en el teléfono real (Yami):** abrir el portal después de publicar. El service worker nuevo baja solo; si quedara la versión anterior, cerrar y volver a abrir el portal.

## Rollback

Volver a subir `assets/socios-guia.js`, `assets/socios-guia.css`, `index.html` y `service-worker.js` de R185 (zip 63). No hay datos que revertir.
