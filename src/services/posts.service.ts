import prisma from '../config/database';
import { sanitizeContent, sanitizeText } from '../utils/sanitize.util';
import slugify from 'slugify';

interface CreatePostData {
  title: string;
  content: string;
  excerpt?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';
  isPinned?: boolean;
  publishAt?: string;
  imageUrls?: string[];
  videoUrls?: string[];
  categoryId?: string;
  tags?: string[];
  authorId: string;
}

interface UpdatePostData extends Partial<CreatePostData> {}

interface PostQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  tag?: string;
  authorId?: string;
  status?: string;
  userId?: string;
}

const POST_SELECT = {
  id: true,
  title: true,
  content: true,
  excerpt: true,
  status: true,
  isPinned: true,
  publishAt: true,
  imageUrls: true,
  videoUrls: true,
  viewCount: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { id: true, name: true, avatar: true, role: true } },
  category: { select: { id: true, name: true, slug: true, color: true } },
  tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
  _count: { select: { likes: true, comments: true } },
};

export async function getPosts(options: PostQueryOptions, requestingUserId?: string) {
  const { page = 1, limit = 20, search, categoryId, tag, authorId, status, userId } = options;
  const skip = (page - 1) * limit;

  const where: any = {};

  // Visibility rules
  if (!requestingUserId) {
    where.status = 'PUBLISHED';
    where.OR = [{ publishAt: null }, { publishAt: { lte: new Date() } }];
  } else {
    const user = await prisma.user.findUnique({ where: { id: requestingUserId }, select: { role: true } });
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'OWNER';
    if (!isAdmin) {
      where.status = 'PUBLISHED';
      where.OR = [{ publishAt: null }, { publishAt: { lte: new Date() } }];
    } else if (status) {
      where.status = status;
    }
  }

  if (search) {
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
          { author: { name: { contains: search, mode: 'insensitive' } } },
        ],
      },
    ];
  }

  if (categoryId) where.categoryId = categoryId;
  if (authorId) where.authorId = authorId;
  if (tag) where.tags = { some: { tag: { slug: tag } } };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      select: POST_SELECT,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);

  // Add like status if user is authenticated
  let likedPostIds: Set<string> = new Set();
  if (userId) {
    const likes = await prisma.postLike.findMany({
      where: { userId, postId: { in: posts.map(p => p.id) } },
      select: { postId: true },
    });
    likedPostIds = new Set(likes.map(l => l.postId));
  }

  const formatted = posts.map(post => ({
    ...post,
    tags: post.tags.map((pt: any) => pt.tag),
    likesCount: post._count.likes,
    commentsCount: post._count.comments,
    isLiked: likedPostIds.has(post.id),
    _count: undefined,
  }));

  return {
    posts: formatted,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getPostById(id: string, userId?: string) {
  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      ...POST_SELECT,
      content: true,
    },
  });

  if (!post) throw { statusCode: 404, message: 'Postagem não encontrada.' };

  // Increment view count
  await prisma.post.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  let isLiked = false;
  if (userId) {
    const like = await prisma.postLike.findUnique({ where: { userId_postId: { userId, postId: id } } });
    isLiked = !!like;
  }

  return {
    ...post,
    tags: (post.tags as any[]).map((pt: any) => pt.tag),
    likesCount: (post as any)._count.likes,
    commentsCount: (post as any)._count.comments,
    isLiked,
    _count: undefined,
  };
}

export async function createPost(data: CreatePostData) {
  const { title, content, excerpt, status = 'DRAFT', isPinned = false, publishAt, imageUrls = [], videoUrls = [], categoryId, tags = [], authorId } = data;

  const processedTags = await Promise.all(
    tags.map(async (tagName) => {
      const slug = slugify(tagName, { lower: true, strict: true });
      return prisma.tag.upsert({
        where: { slug },
        update: {},
        create: { name: sanitizeText(tagName), slug },
      });
    })
  );

  const post = await prisma.post.create({
    data: {
      title: sanitizeText(title),
      content: sanitizeContent(content),
      excerpt: excerpt ? sanitizeText(excerpt) : sanitizeText(content).replace(/<[^>]*>/g, '').slice(0, 200),
      status: status as any,
      isPinned,
      publishAt: publishAt ? new Date(publishAt) : undefined,
      imageUrls,
      videoUrls,
      authorId,
      categoryId: categoryId || undefined,
      tags: {
        create: processedTags.map(tag => ({ tagId: tag.id })),
      },
    },
    select: POST_SELECT,
  });

  return {
    ...post,
    tags: (post.tags as any[]).map((pt: any) => pt.tag),
    likesCount: (post as any)._count.likes,
    commentsCount: (post as any)._count.comments,
    _count: undefined,
  };
}

export async function updatePost(id: string, data: UpdatePostData, requestingUserId: string) {
  const post = await prisma.post.findUnique({ where: { id }, select: { authorId: true } });
  if (!post) throw { statusCode: 404, message: 'Postagem não encontrada.' };

  const user = await prisma.user.findUnique({ where: { id: requestingUserId }, select: { role: true } });
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'OWNER';
  if (!isAdmin && post.authorId !== requestingUserId) {
    throw { statusCode: 403, message: 'Sem permissão para editar esta postagem.' };
  }

  const updateData: any = {};
  if (data.title !== undefined) updateData.title = sanitizeText(data.title);
  if (data.content !== undefined) updateData.content = sanitizeContent(data.content);
  if (data.excerpt !== undefined) updateData.excerpt = sanitizeText(data.excerpt);
  if (data.status !== undefined) updateData.status = data.status;
  if (data.isPinned !== undefined) updateData.isPinned = data.isPinned;
  if (data.publishAt !== undefined) updateData.publishAt = data.publishAt ? new Date(data.publishAt) : null;
  if (data.imageUrls !== undefined) updateData.imageUrls = data.imageUrls;
  if (data.videoUrls !== undefined) updateData.videoUrls = data.videoUrls;
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId || null;

  if (data.tags !== undefined) {
    await prisma.postTag.deleteMany({ where: { postId: id } });
    const processedTags = await Promise.all(
      data.tags.map(async (tagName) => {
        const slug = slugify(tagName, { lower: true, strict: true });
        return prisma.tag.upsert({ where: { slug }, update: {}, create: { name: sanitizeText(tagName), slug } });
      })
    );
    updateData.tags = { create: processedTags.map(tag => ({ tagId: tag.id })) };
  }

  const updated = await prisma.post.update({
    where: { id },
    data: updateData,
    select: POST_SELECT,
  });

  return {
    ...updated,
    tags: (updated.tags as any[]).map((pt: any) => pt.tag),
    likesCount: (updated as any)._count.likes,
    commentsCount: (updated as any)._count.comments,
    _count: undefined,
  };
}

export async function deletePost(id: string, requestingUserId: string) {
  const post = await prisma.post.findUnique({ where: { id }, select: { authorId: true } });
  if (!post) throw { statusCode: 404, message: 'Postagem não encontrada.' };

  const user = await prisma.user.findUnique({ where: { id: requestingUserId }, select: { role: true } });
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'OWNER';
  if (!isAdmin && post.authorId !== requestingUserId) {
    throw { statusCode: 403, message: 'Sem permissão para excluir esta postagem.' };
  }

  await prisma.post.delete({ where: { id } });
  return { message: 'Postagem excluída com sucesso.' };
}

export async function togglePinPost(id: string) {
  const post = await prisma.post.findUnique({ where: { id }, select: { isPinned: true } });
  if (!post) throw { statusCode: 404, message: 'Postagem não encontrada.' };

  const updated = await prisma.post.update({
    where: { id },
    data: { isPinned: !post.isPinned },
    select: { id: true, isPinned: true },
  });

  return updated;
}

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: 'asc' } });
}

export async function createCategory(name: string, description?: string, color?: string) {
  const slug = slugify(name, { lower: true, strict: true });
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) throw { statusCode: 409, message: 'Categoria já existe.' };

  return prisma.category.create({
    data: { name: sanitizeText(name), slug, description: description ? sanitizeText(description) : undefined, color: color || '#6366f1' },
  });
}

export async function updateCategory(id: string, name: string, description?: string, color?: string) {
  return prisma.category.update({
    where: { id },
    data: { name: sanitizeText(name), description: description ? sanitizeText(description) : undefined, color },
  });
}

export async function deleteCategory(id: string) {
  await prisma.category.delete({ where: { id } });
  return { message: 'Categoria excluída.' };
}

export async function getTags() {
  return prisma.tag.findMany({ orderBy: { name: 'asc' } });
}
