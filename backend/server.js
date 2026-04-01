// Backend Entry Point — Express.js Server
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const dotenv     = require('dotenv');
const db         = require('./config/db');

// Load environment variables
dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──
app.use(helmet());                             // Security headers
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://examshield-project.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
}));
app.use(express.json());                       // Parse JSON body
app.use(express.urlencoded({ extended: true }));

// Log all requests (simple logger)
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ── Routes ──
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/exams',    require('./routes/exams'));
app.use('/api/questions',require('./routes/questions'));
app.use('/api/results',  require('./routes/results'));
app.use('/api/attempts', require('./routes/attempts'));
app.use('/api/admin',    require('./routes/admin'));

// ── Health & Test check ──
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', time: new Date().toISOString(), service: 'ExamShield API' });
});

app.get('/api/test', (_req, res) => {
  res.json({ message: 'API working', timestamp: new Date().toISOString() });
});

// ── 404 handler ──
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ── Global error handler ──
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// ── Start server ──
app.listen(PORT, () => {
  console.log(`\n🚀 ExamShield API running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health\n`);
});
