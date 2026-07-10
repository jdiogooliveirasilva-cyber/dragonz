import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as commentsService from '../services/comments.service';
import {
  emitNewComment,
  emitCommentUpdated,
  emitCommentDeleted,
  emitCommentLikeUpdate,
} from '../sockets/socket';

export async function getComments(req: AuthRequest, res: Response): Promise<void> {
  const comments = await commentsService.getComments(req.params.postId, req.user?.id);
  res.json({ success: true, data: comments });
}

export async function createComment(req: AuthRequest, res: Response): Promise<void> {
  const comment = await commentsService.createComment({
    content: req.body.content,
    postId: req.params.postId,
    authorId: req.user!.id,
    parentId: req.body.parentId,
  });
  emitNewComment(req.params.postId, comment);
  res.status(201).json({ success: true, data: comment });
}

export async function updateComment(req: AuthRequest, res: Response): Promise<void> {
  const comment = await commentsService.updateComment(req.params.id, req.body.content, req.user!.id);
  // Emit to the post room — comment carries postId
  emitCommentUpdated((comment as any).postId || '', comment);
  res.json({ success: true, data: comment });
}

export async function deleteComment(req: AuthRequest, res: Response): Promise<void> {
  const result = await commentsService.deleteComment(req.params.id, req.user!.id);
  emitCommentDeleted((result as any).postId || '', req.params.id);
  res.json({ success: true, data: result });
}

export async function togglePinComment(req: AuthRequest, res: Response): Promise<void> {
  const result = await commentsService.togglePinComment(req.params.id);
  emitCommentUpdated((result as any).postId || '', result as any);
  res.json({ success: true, data: result });
}

export async function toggleCommentLike(req: AuthRequest, res: Response): Promise<void> {
  const result = await commentsService.toggleCommentLike(req.params.id, req.user!.id);
  emitCommentLikeUpdate(req.params.id, (result as any).likesCount ?? 0);
  res.json({ success: true, data: result });
}
