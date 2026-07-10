import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import * as authService from '../services/auth.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export const registerValidation = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Nome deve ter entre 2 e 50 caracteres.'),
  body('email').isEmail().normalizeEmail().withMessage('E-mail inválido.'),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres.'),
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('E-mail inválido.'),
  body('password').notEmpty().withMessage('Senha é obrigatória.'),
];

export async function register(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: errors.array()[0].msg });
    return;
  }
  const result = await authService.registerUser(req.body);
  res.cookie('token', result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.status(201).json({ success: true, data: result });
}

export async function login(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: errors.array()[0].msg });
    return;
  }
  const result = await authService.loginUser(req.body);
  res.cookie('token', result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json({ success: true, data: result });
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logout realizado com sucesso.' });
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  res.json({ success: true, data: req.user });
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body;
  if (!email) { res.status(400).json({ success: false, message: 'E-mail é obrigatório.' }); return; }
  const result = await authService.requestPasswordReset(email);
  res.json({ success: true, data: result });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, password } = req.body;
  if (!token || !password) { res.status(400).json({ success: false, message: 'Token e senha são obrigatórios.' }); return; }
  if (password.length < 6) { res.status(400).json({ success: false, message: 'Senha deve ter no mínimo 6 caracteres.' }); return; }
  const result = await authService.resetPassword(token, password);
  res.json({ success: true, data: result });
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body;
  if (!refreshToken) { res.status(400).json({ success: false, message: 'Refresh token é obrigatório.' }); return; }
  const result = await authService.refreshAuthToken(refreshToken);
  res.cookie('token', result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json({ success: true, data: result });
}
