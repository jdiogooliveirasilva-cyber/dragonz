import prisma from '../config/database';

export async function getDashboardStats() {
  const [
    totalUsers,
    totalAdmins,
    totalPosts,
    totalComments,
    totalLikes,
    totalBanned,
    recentPosts,
    recentUsers,
    postsPerDay,
    usersPerDay,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: { in: ['ADMIN', 'OWNER'] } } }),
    prisma.post.count({ where: { status: 'PUBLISHED' } }),
    prisma.comment.count(),
    prisma.postLike.count(),
    prisma.user.count({ where: { role: 'BANNED' } }),
    prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        id: true, title: true, createdAt: true,
        author: { select: { name: true } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true, avatar: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    // Posts per day for last 7 days
    prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM posts
      WHERE created_at > NOW() - INTERVAL '7 days'
        AND status = 'PUBLISHED'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `,
    // Users per day for last 7 days
    prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `,
  ]);

  // Online users (seen in last 5 minutes)
  const onlineUsers = await prisma.user.count({
    where: { lastSeen: { gte: new Date(Date.now() - 5 * 60 * 1000) } },
  });

  return {
    stats: {
      totalUsers,
      totalAdmins,
      totalPosts,
      totalComments,
      totalLikes,
      totalBanned,
      onlineUsers,
    },
    recentPosts: recentPosts.map(p => ({
      ...p,
      likesCount: (p as any)._count.likes,
      commentsCount: (p as any)._count.comments,
      _count: undefined,
    })),
    recentUsers,
    charts: {
      postsPerDay: postsPerDay.map(d => ({ date: d.date, count: Number(d.count) })),
      usersPerDay: usersPerDay.map(d => ({ date: d.date, count: Number(d.count) })),
    },
  };
}

export async function setUserRole(targetUserId: string, role: string, requestingUserId: string) {
  const requesting = await prisma.user.findUnique({ where: { id: requestingUserId }, select: { role: true } });
  const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { role: true } });

  if (!target) throw { statusCode: 404, message: 'Usuário não encontrado.' };

  // Only owner can create/remove admins
  if ((role === 'ADMIN' || target.role === 'ADMIN') && requesting?.role !== 'OWNER') {
    throw { statusCode: 403, message: 'Apenas o proprietário pode gerenciar administradores.' };
  }

  // Cannot change owner's role
  if (target.role === 'OWNER') {
    throw { statusCode: 403, message: 'Não é possível alterar o cargo do proprietário.' };
  }

  // Cannot promote to OWNER
  if (role === 'OWNER') {
    throw { statusCode: 403, message: 'Não é possível promover um usuário a proprietário.' };
  }

  return prisma.user.update({
    where: { id: targetUserId },
    data: { role: role as any },
    select: { id: true, name: true, email: true, role: true },
  });
}

export async function banUser(targetUserId: string, requestingUserId: string) {
  const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { role: true } });
  if (!target) throw { statusCode: 404, message: 'Usuário não encontrado.' };
  if (target.role === 'OWNER') throw { statusCode: 403, message: 'Não é possível banir o proprietário.' };

  const requesting = await prisma.user.findUnique({ where: { id: requestingUserId }, select: { role: true } });
  if (target.role === 'ADMIN' && requesting?.role !== 'OWNER') {
    throw { statusCode: 403, message: 'Apenas o proprietário pode banir administradores.' };
  }

  return prisma.user.update({
    where: { id: targetUserId },
    data: { role: 'BANNED' },
    select: { id: true, name: true, email: true, role: true },
  });
}

export async function unbanUser(targetUserId: string) {
  const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { role: true } });
  if (!target) throw { statusCode: 404, message: 'Usuário não encontrado.' };
  if (target.role !== 'BANNED') throw { statusCode: 400, message: 'Usuário não está banido.' };

  return prisma.user.update({
    where: { id: targetUserId },
    data: { role: 'USER' },
    select: { id: true, name: true, email: true, role: true },
  });
}

export async function deleteUser(targetUserId: string, requestingUserId: string) {
  if (targetUserId === requestingUserId) {
    throw { statusCode: 400, message: 'Você não pode excluir sua própria conta por aqui.' };
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { role: true } });
  if (!target) throw { statusCode: 404, message: 'Usuário não encontrado.' };
  if (target.role === 'OWNER') throw { statusCode: 403, message: 'Não é possível excluir o proprietário.' };

  await prisma.user.delete({ where: { id: targetUserId } });
  return { message: 'Usuário excluído com sucesso.' };
}
