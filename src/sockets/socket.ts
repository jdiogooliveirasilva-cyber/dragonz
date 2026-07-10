import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt.util';
import prisma from '../config/database';

interface SocketUser {
  id: string;
  name: string;
  role: string;
}

const onlineUsers = new Map<string, Set<string>>(); // userId -> Set<socketId>

// Module-level io reference so controllers can call emit helpers without receiving io
let _io: Server | null = null;

export function initSocket(io: Server): void {
  _io = io;

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      if (token) {
        const decoded = verifyToken(token);
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, name: true, role: true, isActive: true },
        });
        if (user && user.isActive && user.role !== 'BANNED') {
          (socket as any).user = user;
        }
      }
      next();
    } catch {
      next();
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as SocketUser | undefined;

    if (user) {
      if (!onlineUsers.has(user.id)) onlineUsers.set(user.id, new Set());
      onlineUsers.get(user.id)!.add(socket.id);
      socket.join(`user:${user.id}`);
      io.emit('online_count', onlineUsers.size);
    }

    // Join post room for real-time updates
    socket.on('join_post', (postId: string) => {
      if (typeof postId === 'string' && postId.length < 50) {
        socket.join(`post:${postId}`);
      }
    });

    socket.on('leave_post', (postId: string) => {
      if (typeof postId === 'string') {
        socket.leave(`post:${postId}`);
      }
    });

    socket.on('disconnect', () => {
      if (user) {
        const sockets = onlineUsers.get(user.id);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) onlineUsers.delete(user.id);
        }
        io.emit('online_count', onlineUsers.size);
      }
    });
  });
}

// Helper: safely get io without throwing
function getIo(): Server | null {
  return _io;
}

export function emitNewPost(post: any): void {
  getIo()?.emit('new_post', post);
}

export function emitPostUpdated(post: any): void {
  getIo()?.emit('post_updated', post);
}

export function emitPostDeleted(postId: string): void {
  getIo()?.emit('post_deleted', postId);
}

export function emitNewComment(postId: string, comment: any): void {
  const io = getIo();
  if (!io) return;
  io.to(`post:${postId}`).emit('new_comment', comment);
  io.emit('comment_count_update', { postId, action: 'add' });
}

export function emitCommentUpdated(postId: string, comment: any): void {
  if (!postId) return; // guard against empty postId
  getIo()?.to(`post:${postId}`).emit('comment_updated', comment);
}

export function emitCommentDeleted(postId: string, commentId: string): void {
  const io = getIo();
  if (!io) return;
  if (postId) io.to(`post:${postId}`).emit('comment_deleted', commentId);
  io.emit('comment_count_update', { postId, action: 'remove' });
}

export function emitLikeUpdate(postId: string, likesCount: number): void {
  getIo()?.emit('like_update', { postId, likesCount });
}

export function emitCommentLikeUpdate(commentId: string, likesCount: number): void {
  // Broadcast globally; clients filter by commentId
  getIo()?.emit('comment_like_update', { commentId, likesCount });
}

export function emitMaintenanceToggle(enabled: boolean): void {
  getIo()?.emit('maintenance_toggle', { enabled });
}

export function emitSiteSettingsUpdate(settings: any): void {
  getIo()?.emit('settings_update', settings);
}

export function getOnlineCount(): number {
  return onlineUsers.size;
}
