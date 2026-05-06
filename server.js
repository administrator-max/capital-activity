require('dotenv').config();
const express    = require('express');
const session    = require('express-session');
const path       = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;
const PIN  = process.env.DASHBOARD_PIN;
const PIN_DISABLED = process.env.DISABLE_PIN === 'true';

if (!PIN && !PIN_DISABLED) {
  console.error('❌  DASHBOARD_PIN is not set in environment variables.');
  process.exit(1);
}

if (PIN_DISABLED) {
  console.warn('⚠️   PIN AUTH DISABLED — dashboard is publicly accessible.');
}

// ── TRUST HEROKU PROXY (wajib agar secure cookie bekerja) ──
app.set('trust proxy', 1);

// ── MIDDLEWARE ──────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'capital-activity-fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',  // HTTPS only di prod (Heroku/Render set NODE_ENV=production); allow HTTP di local dev
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000  // 8 jam
  }
}));

// ── ANTI-CRAWL HEADERS ──────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Robots-Tag',           'noindex, nofollow, noarchive, nosnippet, noimageindex');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options',        'DENY');
  res.setHeader('Referrer-Policy',        'no-referrer');
  res.setHeader('Cache-Control',          'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma',                 'no-cache');
  next();
});

// ── AUTH GUARD ──────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (PIN_DISABLED) return next();
  if (req.session && req.session.authenticated) return next();
  res.redirect('/pin');
}

// ── ROUTES ──────────────────────────────────────────────────

// robots.txt — block all crawlers
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send('User-agent: *\nDisallow: /\n');
});

// PIN page (GET)
app.get('/pin', (req, res) => {
  if (PIN_DISABLED) return res.redirect('/');
  if (req.session && req.session.authenticated) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'views', 'pin.html'));
});

// PIN verification (POST)
app.post('/pin', (req, res) => {
  if (PIN_DISABLED) return res.redirect('/');
  const entered = (req.body.pin || '').trim();
  if (entered === PIN) {
    req.session.authenticated = true;
    return res.redirect('/');
  }
  res.redirect('/pin?error=1');
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/pin'));
});

// Dashboard (protected)
app.get('/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Static assets — protected
app.use('/static', requireAuth, express.static(path.join(__dirname, 'static')));

// ── START ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  Capital Activity Dashboard running on port ${PORT}`);
});