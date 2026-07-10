import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password.util';
import { sanitizeText } from '../utils/sanitize.util';

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      bio: true,
      createdAt: true,
      lastSeen: true,
      _count: { select: { comments: true, postLikes: true, posts: true } },
    },
  });

  if (!user) throw { statusCode: 404, message: 'Usuário não encontrado.' };

  return {
    ...user,
    commentsCount: (user as any)._count.comments,
    likesGiven: (user as any)._count.postLikes,
    postsCount: (user as any)._count.posts,
    _count: undefined,
  };
}

export async function updateProfile(userId: string, data: { name?: string; bio?: string; avatar?: string }) {
  const updateData: any = {};
  if (data.name) updateData.name = sanitizeText(data.name);
  if (data.bio !== undefined) updateData.bio = data.bio ? sanitizeText(data.bio) : null;
  if (data.avatar !== undefined) updateData.avatar = data.avatar;

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, avatar: true, bio: true },
  });

  return user;
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { password: true } });
  if (!user) throw { statusCode: 404, message: 'Usuário não encontrado.' };

  const valid = await comparePassword(currentPassword, user.password);
  if (!valid) throw { statusCode: 400, message: 'Senha atual incorreta.' };

  const hashed = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

  return { message: 'Senha alterada com sucesso.' };
}

export async function togglePostLike(postId: string, userId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true, status: true } });
  if (!post || post.status !== 'PUBLISHED') {
    throw { statusCode: 404, message: 'Postagem não encontrada.' };
  }

  const existing = await prisma.postLike.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  if (existing) {
    await prisma.postLike.delete({ where: { userId_postId: { userId, postId } } });
    const count = await prisma.postLike.count({ where: { postId } });
    return { liked: false, likesCount: count };
  } else {
    await prisma.postLike.create({ data: { userId, postId } });
    const count = await prisma.postLike.count({ where: { postId } });
    return { liked: true, likesCount: count };
  }
}

export async function getUsers(page = 1, limit = 20, search?: string, role?: string) {
  const skip = (page - 1) * limit;
  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (role) where.role = role;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, role: true, avatar: true, bio: true,
        isActive: true, createdAt: true, lastSeen: true,
        _count: { select: { comments: true, postLikes: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map(u => ({
      ...u,
      commentsCount: (u as any)._count.comments,
      likesCount: (u as any)._count.postLikes,
      _count: undefined,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
