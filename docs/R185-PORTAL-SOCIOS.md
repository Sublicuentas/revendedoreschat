# Panel de Socios · R185 — Guía maestra «Rediseño visual y lógica» (07 nov 2026)

Estado: **listo para staging, NO publicado**. Pruebas con API simulada (validación real del servidor), datos FICTICIOS.
No se tocó APK, bot de Telegram, Sublichat HQ ni SubliStudio. Pagos, catálogo, permisos y flujos de compra/renovación: iguales.

## Fase 0 · Auditoría (lo que había)

| Punto | Hallazgo |
|---|---|
| Stack | HTML + JS sin framework, por capas: `core.js` → `operations.js` → `catalog-aula.js` → `panel-web-20260925.js` → `messaging.js` → `socios-2026.js` → `socios-entregas.js` → `socios-orden.js`. API: `sublicuentas-panel-api.onrender.com` (`server_api.js` del repo del bot). |
| Producción | GitHub `revendedoreschat` = zip 19 «Orden visual» (30/10). Verificado archivo por archivo. |
| Barra | Inicio · Clientes · Compras (=nueva compra) · **Pedidos** · Más. |
| Inicio | Hero morado, «＋ Nueva compra», lista «Pendientes de hoy», resumen financiero. |
| Clientes | 4 filtros (sin «Renovaciones»); el duplicado de un cliente se contaba dos veces. |
| Avisos | La API entrega solo los **10 más recientes**. Sin filtro por mes/año. |
| Historial de pedidos | El panel pedía 60; la API corta en **100**. |
| Metas | **No existe** meta por socio en ningún lado (ni base, ni API, ni HQ). |

## Lo que se hizo (Fases 1–5)

| # | Pantalla | Cómo quedó |
|---|---|---|
| 1 | Barra | **Inicio · Clientes · Compras · Catálogo · Más** (exacto). Activo en rojo. Safe-area. Sin «Pedidos». |
| 2 | Cabecera | ☰ (actualizar, novedades, instalar, salir) · logo oficial Sublicuentas + «Portal de Socios» · campana (Buzón) · iniciales → Mi perfil. |
| 3 | Inicio | «Hola, *nombre real*» (nunca «Hola, socio»), fecha y hora **America/Tegucigalpa** (se actualiza sola), 4 tarjetas, Metas del mes, avisos reales. **Sin** Nueva compra ni Accesos rápidos ni promos. Se dejó un único aviso rojo si un pedido tiene «falta información» (es un dato real que bloquea la entrega). |
| 4 | Clientes | Filtros **Todos · Vigentes · Renovaciones · Vencidos · Sin servicio** con contador; búsqueda por nombre, teléfono **y servicio**; tarjeta con servicios, fecha más próxima, monto («total» si son varios) y estado. Sin duplicados. «Resumen de cobros» se conserva plegado abajo. |
| 5 | Ficha | Todos los servicios (sin recortar), cada uno con precio, vencimiento, estado y **«Renovar este servicio»** (mismo modal de siempre: período, nueva fecha y total antes de confirmar). Mensaje de cobro y WhatsApp igual. «Nueva compra para…» se conserva. |
| 6 | Compras | Único botón. Pestañas **Todos / Entregados** + búsqueda. Detalle con historial y comprobante como antes. «＋ Nueva compra» dentro de Compras. «Datos de entregas» (cuentas/PIN) sigue accesible. Pide el historial completo (500). |
| 7 | Buzón | Mismas dos pestañas. Avisos con **mes y año** (fecha original), más reciente primero, «No hay avisos para este periodo», el aviso se abre completo. El filtro se conserva al volver. |
| 8 | Más | Renovaciones · Catálogo · Buzón · Subli Aula · Recompensas · Mi perfil + «Salir de mi cuenta». Nada nuevo. |
| 9 | Catálogo | Misma lógica y precios; solo estilo. Barra y Más abren la misma ruta. |
| 10 | Metas | Tocando la tarjeta: mes/año, ventas, meta y %. Sin meta → **«Meta no configurada»** (nunca L60,000 ni un % inventado; nunca divide entre 0). |

**Reglas de datos (pág. 13):** Inicio, chips y lista usan el **mismo selector**. «Renovaciones» usa la ventana que ya tenía el panel
(`CONFIG.avisoDias` = 7, la de `estado()`), no una nueva. Un cliente puede estar en varios filtros. Ceros solo después de cargar:
mientras tanto, esqueleto.

**Estilo:** Inter 700/600/400-500 · rojo #E2231A · texto #101827 · fondo #F6F7FA · tarjetas blancas · borde #E1E5EE + sombra baja.
Hover −2 px / 1.01 (180 ms, solo con puntero) · toque 0.975 · foco de 3 px · movimiento reducido = sin animación. Sin neón ni degradados.

## Conflictos encontrados (se documentan, no se inventa nada)

1. **«Mis ventas»**: el sistema no guarda lo que el socio le cobra a su cliente. Se usó la cifra oficial que ya existe:
   *compras + renovaciones registradas a Sublicuentas en el mes* (`/rev/metricas` → `operadoMes`, misma del Centro Financiero).
   **Confirmar con Lic.** si esa es la definición deseada.
2. **Metas**: no existen. El panel lee `revendedores/{id}.metas["AAAA-MM"]` o `metaMensual` **si Sublicuentas los configura**.
   Hoy no hay pantalla para configurarlas (no se creó en silencio, como pide la pág. 16). Necesidad: agregar ese campo en HQ → Revendedores.
3. **Historial completo y avisos de años anteriores** requieren 4 ajustes de **solo lectura** en la API del panel (`server_api.js`, repo del bot,
   servicio Render del panel). Van en un zip aparte y **opcional**. Sin ellos el portal funciona igual: muestra hasta 100 pedidos, los 10 avisos
   recientes y «Todavía no hay datos de ese mes» en Metas de meses anteriores.
4. **Pedidos antiguos entregados** (pág. 15): no se ejecutó ninguna migración. Va un script con simulación (dry-run), respaldo, lote y reversión.

## Archivos (Panel de Socios · GitHub `revendedoreschat`)

| Archivo | Cambio |
|---|---|
| `index.html` | carga `socios-guia.css/js` (`?v=20261107-r185`), color de tema blanco |
| `service-worker.js` | caché nueva `…-guia-20261107-r185` (borra la anterior al activar) + archivos nuevos |
| `assets/socios-guia.js` | **nuevo** · capa de la guía (barra, cabecera, Inicio, Metas, Clientes, Ficha, Compras, Buzón, Más) |
| `assets/socios-guia.css` | **nuevo** · estilo claro 3D suave |
| `assets/logo-sublicuentas.webp` | **nuevo** · logo oficial (el mismo de Sublichat HQ) |
| `tests/socios-guia-r185.e2e.mjs` | **nuevo** · 11 casos de aceptación |
| `tests/capturas-r185.mjs` | **nuevo** · capturas antes/después con los mismos datos |
| `tests/socios-rediseno.e2e.mjs` | ajustado a la barra nueva (Pedidos → Compras, Catálogo en la barra) |

**Retirado de la pantalla:** botón «Pedidos» de la barra, «＋ Nueva compra» del Inicio, lista «Pendientes de hoy», hero morado,
filtros de estado de Pedidos (ahora Todos/Entregados + búsqueda). **No se borró código**: los archivos anteriores siguen cargando debajo.

## Pruebas

- `tests/socios-guia-r185.e2e.mjs`: **11/11** (barra y Más exactos; Inicio con nombre, fecha/hora HN y tarjetas que cuadran con su destino;
  esqueleto sin ceros con red lenta; 5 filtros y contadores; ficha con 4 servicios y renovar por servicio; Compras; Buzón mes/año con año
  anterior y periodo vacío; Metas con y sin meta; 360/390/768/1024/1440 sin desborde ni contenido tapado; permisos; accesibilidad).
- `tests/socios-rediseno.e2e.mjs` (compra, entregas, buzón, Telegram, permisos, zoom 200 %): **15/15**.
- Bot/API (zip aparte): **163/163** (`npm test`, incluye 4 nuevas de R185).
- **Pendiente de Sublicuentas:** prueba en teléfono real (Android e iPhone) en staging, como pide la pág. 19 punto 12.

## Riesgos

- Socios acostumbrados a «Pedidos» en la barra: ahora es «Compras» (mismo contenido).
- «Mis ventas» puede no ser la definición que Lic. espera (ver conflicto 1).
- Caché del navegador: la PWA cambia de nombre de caché, así que baja lo nuevo al primer refresco.

## Rollback

Volver a subir a `revendedoreschat` el `index.html` y `service-worker.js` del zip 19 y borrar `assets/socios-guia.*`.
No hay migraciones ni datos nuevos en el portal. La API opcional y el script tienen su propio rollback (ver su documento).

## Checklist pág. 19

| # | Criterio | Estado |
|---|---|---|
| 01 | 5 botones exactos | ✅ |
| 02 | Más conserva sus 6 + Salir | ✅ |
| 03 | Nombre real, fecha y hora de Honduras | ✅ |
| 04 | Sin Nueva compra / Accesos rápidos / promos en Inicio | ✅ |
| 05 | 5 filtros con contadores correctos | ✅ |
| 06 | Ficha con todos los servicios y Renovar por servicio | ✅ |
| 07 | Historial + entregas antiguas corregidas | ✅ pantalla · ⏳ migración lista para dry-run (la corre Sublicuentas) |
| 08 | Buzón con avisos por mes y año | ✅ (años anteriores completos con la API opcional) |
| 09 | Metas reales, sin % falso | ✅ (falta que Sublicuentas configure metas) |
| 10 | Claro, 3D suave, cero neón | ✅ |
| 11 | No se altera permisos, pagos, CRM, APK, Telegram, HQ, SubliStudio | ✅ (la API opcional es solo lectura) |
| 12 | Capturas y prueba en móviles reales | ✅ capturas · ⏳ teléfono real |
