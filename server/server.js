const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const morgan     = require('morgan');
const dotenv     = require('dotenv');

dotenv.config();

require('./keepalive')();

const connectDB       = require('./config/db');
const authRoutes      = require('./routes/auth');
const boardRoutes     = require('./routes/boards');
const aiRoutes        = require('./routes/ai');
const errorHandler    = require('./middleware/errorHandler');
const socketHandler   = require('./socket/socketHandler');

// ── Connect Database ─────────────────────────────────────────
connectDB();

// ── Express App ───────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);

// ── Socket.IO ─────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin:  process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});
socketHandler(io);

// ── Middleware ────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',   authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/ai',     aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', uptime: process.uptime() });
});

// ── Error Handler ─────────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n✦ SketchLink Server running on port ${PORT}`);
  console.log(`  http://localhost:${PORT}\n`);
});
