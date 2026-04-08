const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const { errorHandler } = require('./middleware/errorHandler');
const { startCronJobs } = require('./jobs/cron');

// Routes
const authRoutes = require('./routes/auth');
const inviteRoutes = require('./routes/invites');
const shiftRoutes = require('./routes/shifts');
const availabilityRoutes = require('./routes/availability');
const attendanceRoutes = require('./routes/attendance');
const leaveRoutes = require('./routes/leaves');
const swapRoutes = require('./routes/swaps');
const noticeRoutes = require('./routes/notices');
const userRoutes = require('./routes/users');
const schedulerRoutes = require('./routes/scheduler');

const app = express();
const server = http.createServer(app);

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: config.frontend.url,
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

// Middleware
app.use(helmet());
app.use(cors({ origin: config.frontend.url }));
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/swaps', swapRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/scheduler', schedulerRoutes);

// Socket Connections
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join:business', (businessId) => {
    socket.join(`business:${businessId}`);
    console.log(`Socket ${socket.id} joined business:${businessId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error Handler
app.use(errorHandler);

// Start Cron Jobs
startCronJobs();

// Start Server
const PORT = config.port;
server.listen(PORT, () => {
  console.log(`
  🚀 ShiftSync Backend Running
  ===========================
  Port: ${PORT}
  Environment: ${config.nodeEnv}
  Frontend URL: ${config.frontend.url}
  ===========================
  `);
});

module.exports = { app, server };
