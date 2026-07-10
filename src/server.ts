import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { initSocket } from './sockets/socket';
import prisma from './config/database';

const PORT = parseInt(process.env.PORT || '3000', 10);

const httpServer = http.createServer(app);

const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || 'http://localhost:5173').split(',');

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins.map(o => o.trim()),
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Make io available in the app (for controllers to emit events)
(app as any).set('io', io);

initSocket(io);

async function startServer(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Ensure settings singleton exists
    await prisma.siteSettings.upsert({
      where: { id: 'singleton' },
      update: {},
      create: { id: 'singleton' },
    });

    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 PostHub server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`🔗 API: http://localhost:${PORT}/api`);
        console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  httpServer.close(() => process.exit(0));
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
