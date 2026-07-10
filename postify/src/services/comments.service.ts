import prisma from '../config/database';
import { sanitizeText } from '../utils/sanitize.util';

interface CreateCommentData {
  content: string;
  postId: string;
  authorId: string;
  parentId?: string;
}

const COMMENT_SELECT = {
  id: true,
  content: true,
  isPinned: true,
  postId: true,
  parentId: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { id: true, name: true, avatar: true, role: true } },
  _count: { select: { likes: true, replies: true } },
};

export async function getComments(postId: string, userId?: string) {
  // Get top-level comments
  const comments = await prisma.comment.findMany({
    where: { postId, parentId: null },
    select: {
      ...COMMENT_SELECT,
      replies: {
        select: {
          ...COMMENT_SELECT,
          replies: {
            select: COMMENT_SELECT,
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'asc' }],
      },
    },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'asc' }],
  });

  // Get liked comment IDs for user
  let likedCommentIds: Set<string> = new Set();
  if (userId) {
    const allCommentIds = comments.flatMap(c => [
      c.id,
      ...(c as any).replies.flatMap((r: any) => [r.id, ...r.replies.map((rr: any) => rr.id)]),
    ]);
    const likes = await prisma.commentLike.findMany({
      where: { userId, commentId: { in: allCommentIds } },
      select: { commentId: true },
    });
    likedCommentIds = new Set(likes.map(l => l.commentId));
  }

  function formatComment(c: any): any {
    return {
      ...c,
      likesCount: c._count.likes,
      repliesCount: c._count.replies,
      isLiked: likedCommentIds.has(c.id),
      replies: c.replies ? c.replies.map(formatComment) : undefined,
      _count: undefined,
    };
  }

  return comments.map(formatComment);
}

export async function createComment(data: CreateCommentData) {
  const { content, postId, authorId, parentId } = data;

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true, status: true } });
  if (!post || post.status !== 'PUBLISHED') {
    throw { statusCode: 404, message: 'Postagem não encontrada.' };
  }

  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId }, select: { id: true, postId: true } });
    if (!parent || parent.postId !== postId) {
      throw { statusCode: 404, message: 'Comentário pai não encontrado.' };
    }
  }

  const comment = await prisma.comment.create({
    data: {
      content: sanitizeText(content),
      postId,
      authorId,
      parentId: parentId || null,
    },
    select: {
      ...COMMENT_SELECT,
      replies: { select: COMMENT_SELECT },
    },
  });

  return {
    ...comment,
    likesCount: (comment as any)._count.likes,
    repliesCount: (comment as any)._count.replies,
    isLiked: false,
    replies: [],
    _count: undefined,
  };
}

export async function updateComment(id: string, content: string, requestingUserId: string) {
  const comment = await prisma.comment.findUnique({ where: { id }, select: { authorId: true } });
  if (!comment) throw { statusCode: 404, message: 'Comentário não encontrado.' };

  const user = await prisma.user.findUnique({ where: { id: requestingUserId }, select: { role: true } });
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'OWNER';
  if (!isAdmin && comment.authorId !== requestingUserId) {
    throw { statusCode: 403, message: 'Sem permissão para editar este comentário.' };
  }

  return prisma.comment.update({
    where: { id },
    data: { content: sanitizeText(content) },
    select: COMMENT_SELECT,
  });
}

export async function deleteComment(id: string, requestingUserId: string) {
  const comment = await prisma.comment.findUnique({ where: { id }, select: { authorId: true, postId: true } });
  if (!comment) throw { statusCode: 404, message: 'Comentário não encontrado.' };

  const user = await prisma.user.findUnique({ where: { id: requestingUserId }, select: { role: true } });
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'OWNER';
  if (!isAdmin && comment.authorId !== requestingUserId) {
    throw { statusCode: 403, message: 'Sem permissão para excluir este comentário.' };
  }

  await prisma.comment.delete({ where: { id } });
  // Return postId so the controller can emit to the correct Socket.IO room
  return { message: 'Comentário excluído.', postId: comment.postId };
}

export async function togglePinComment(id: string) {
  const comment = await prisma.comment.findUnique({ where: { id }, select: { isPinned: true, postId: true } });
  if (!comment) throw { statusCode: 404, message: 'Comentário não encontrado.' };

  return prisma.comment.update({
    where: { id },
    data: { isPinned: !comment.isPinned },
    // Include postId so controller can emit to correct Socket.IO room
    select: { id: true, isPinned: true, postId: true },
  });
}

export async function toggleCommentLike(commentId: string, userId: string) {
  const existing = await prisma.commentLike.findUnique({
    where: { userId_commentId: { userId, commentId } },
  });

  if (existing) {
    await prisma.commentLike.delete({ where: { userId_commentId: { userId, commentId } } });
    const count = await prisma.commentLike.count({ where: { commentId } });
    return { liked: false, likesCount: count };
  } else {
    await prisma.commentLike.create({ data: { userId, commentId } });
    const count = await prisma.commentLike.count({ where: { commentId } });
    return { liked: true, likesCount: count };
  }
}
