import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as postsService from '../services/posts.service';
import { emitNewPost, emitPostUpdated, emitPostDeleted } from '../sockets/socket';

export async function getPosts(req: AuthRequest, res: Response): Promise<void> {
  const { page, limit, search, categoryId, tag, authorId, status } = req.query;
  const result = await postsService.getPosts(
    {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? Math.min(parseInt(limit as string), 50) : 20,
      search: search as string,
      categoryId: categoryId as string,
      tag: tag as string,
      authorId: authorId as string,
      status: status as string,
    },
    req.user?.id
  );
  res.json({ success: true, data: result });
}

export async function getPost(req: AuthRequest, res: Response): Promise<void> {
  const post = await postsService.getPostById(req.params.id, req.user?.id);
  res.json({ success: true, data: post });
}

export async function createPost(req: AuthRequest, res: Response): Promise<void> {
  const post = await postsService.createPost({ ...req.body, authorId: req.user!.id });
  // Emit real-time event if post is published
  if (post.status === 'PUBLISHED') {
    emitNewPost(post);
  }
  res.status(201).json({ success: true, data: post });
}

export async function updatePost(req: AuthRequest, res: Response): Promise<void> {
  const post = await postsService.updatePost(req.params.id, req.body, req.user!.id);
  emitPostUpdated(post);
  res.json({ success: true, data: post });
}

export async function deletePost(req: AuthRequest, res: Response): Promise<void> {
  const result = await postsService.deletePost(req.params.id, req.user!.id);
  emitPostDeleted(req.params.id);
  res.json({ success: true, data: result });
}

export async function togglePin(req: AuthRequest, res: Response): Promise<void> {
  const result = await postsService.togglePinPost(req.params.id);
  emitPostUpdated(result as any);
  res.json({ success: true, data: result });
}

export async function getCategories(_req: AuthRequest, res: Response): Promise<void> {
  const categories = await postsService.getCategories();
  res.json({ success: true, data: categories });
}

export async function createCategory(req: AuthRequest, res: Response): Promise<void> {
  const { name, description, color } = req.body;
  const category = await postsService.createCategory(name, description, color);
  res.status(201).json({ success: true, data: category });
}

export async function updateCategory(req: AuthRequest, res: Response): Promise<void> {
  const { name, description, color } = req.body;
  const category = await postsService.updateCategory(req.params.id, name, description, color);
  res.json({ success: true, data: category });
}

export async function deleteCategory(req: AuthRequest, res: Response): Promise<void> {
  const result = await postsService.deleteCategory(req.params.id);
  res.json({ success: true, data: result });
}

export async function getTags(_req: AuthRequest, res: Response): Promise<void> {
  const tags = await postsService.getTags();
  res.json({ success: true, data: tags });
}
