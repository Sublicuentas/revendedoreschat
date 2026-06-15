/* ════════════════════════════════════════════════════════════════
   PANEL REVENDEDORES  ·  pegar DENTRO de index_08_api.js
   ────────────────────────────────────────────────────────────────
   1) Instalá los paquetes:
        npm i bcryptjs jsonwebtoken cors
   2) En Render → tu servicio → Environment → Add:
        JWT_SECRET = (una frase larga y aleatoria, inventala)
   3) Esto asume que ya tenés en el archivo:
        const app   = express();
        const admin = require('firebase-admin');   // ya inicializado
        const db    = admin.firestore();
   4) Si todavía NO usás cors / express.json, descomentá las 2 líneas marcadas.
   ════════════════════════════════════════════════════════════════ */

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const cors   = require('cors');
const JWT_SECRET = process.env.JWT_SECRET || 'CAMBIAME_EN_RENDER';

// app.use(cors());          // ← descomentá si aún NO usás cors
// app.use(express.json());  // ← descomentá si aún NO parseás JSON


// Middleware: valida el token y deja al revendedor en req.rev
function revAuth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'sin_token' });
  try { req.rev = jwt.verify(token, JWT_SECRET); next(); }
  catch (e) { return res.status(401).json({ error: 'token_invalido' }); }
}


/* ── LOGIN ──  usuario = nombre_norm del revendedor (ej. "geissel") ── */
app.post('/api/rev/login', async (req, res) => {
  try {
    const usuario  = (req.body.usuario  || '').trim().toLowerCase();
    const password = (req.body.password || '').trim();
    if (!usuario || !password) return res.status(400).json({ error: 'faltan_datos' });

    const snap = await db.collection('revendedores')
      .where('nombre_norm', '==', usuario).limit(1).get();
    if (snap.empty) return res.status(401).json({ error: 'credenciales' });

    const doc = snap.docs[0], d = doc.data();
    if (d.activo === false) return res.status(403).json({ error: 'inactivo' });

    if (!d.passwordHash) {
      // Primera vez: la clave que escriba queda guardada (hasheada)
      const hash = await bcrypt.hash(password, 10);
      await doc.ref.update({ passwordHash: hash });
    } else {
      const ok = await bcrypt.compare(password, d.passwordHash);
      if (!ok) return res.status(401).json({ error: 'credenciales' });
    }

    const token = jwt.sign(
      { id: doc.id, nombre: d.nombre, nombre_norm: d.nombre_norm },
      JWT_SECRET, { expiresIn: '30d' }
    );
    res.json({ token, nombre: d.nombre, nombre_norm: d.nombre_norm });
  } catch (e) { console.error('login', e); res.status(500).json({ error: 'server' }); }
});


/* ── CLIENTES del revendedor (filtrado en el servidor por su nombre_norm) ── */
app.get('/api/rev/clientes', revAuth, async (req, res) => {
  try {
    const snap = await db.collection('clientes')
      .where('vendedor_norm', '==', req.rev.nombre_norm).get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (e) { console.error('clientes', e); res.status(500).json({ error: 'server' }); }
});


/* ── PRECIOS (tabla de inventario) ── */
app.get('/api/rev/precios', revAuth, async (req, res) => {
  try {
    const snap = await db.collection('inventario').get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (e) { console.error('precios', e); res.status(500).json({ error: 'server' }); }
});


/* ── (Opcional) cambiar la propia clave estando logueado ── */
app.post('/api/rev/clave', revAuth, async (req, res) => {
  try {
    const nueva = (req.body.password || '').trim();
    if (nueva.length < 4) return res.status(400).json({ error: 'clave_corta' });
    const hash = await bcrypt.hash(nueva, 10);
    await db.collection('revendedores').doc(req.rev.id).update({ passwordHash: hash });
    res.json({ ok: true });
  } catch (e) { console.error('clave', e); res.status(500).json({ error: 'server' }); }
});
