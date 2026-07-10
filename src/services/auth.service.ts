import prisma from '../config/database';
import { hashPassword, comparePassword, generateResetToken } from '../utils/password.util';
import { generateToken, generateRefreshToken } from '../utils/jwt.util';
import { sanitizeText } from '../utils/sanitize.util';

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

export async function registerUser(data: RegisterData) {
  const { name, email, password } = data;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    if (existing.role === 'BANNED') {
      throw { statusCode: 403, message: 'Este e-mail está banido e não pode ser usado para criar uma nova conta.' };
    }
    throw { statusCode: 409, message: 'Este e-mail já está cadastrado.' };
  }

  const userCount = await prisma.user.count();
  const role = userCount === 0 ? 'OWNER' : 'USER';

  const hashedPassword = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      name: sanitizeText(name),
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role as any,
    },
    select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
  });

  const token = generateToken({ userId: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role });

  return { user, token, refreshToken };
}

export async function loginUser(data: LoginData) {
  const { email, password } = data;

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    throw { statusCode: 401, message: 'E-mail ou senha inválidos.' };
  }

  if (user.role === 'BANNED') {
    throw { statusCode: 403, message: 'Sua conta foi banida. Entre em contato com o administrador.' };
  }

  if (!user.isActive) {
    throw { statusCode: 403, message: 'Conta desativada.' };
  }

  const validPassword = await comparePassword(password, user.password);
  if (!validPassword) {
    throw { statusCode: 401, message: 'E-mail ou senha inválidos.' };
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastSeen: new Date() } });

  const token = generateToken({ userId: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role });

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, bio: user.bio },
    token,
    refreshToken,
  };
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    // Don't reveal if email exists
    return { message: 'Se o e-mail estiver cadastrado, você receberá as instruções de recuperação.' };
  }

  const resetToken = generateResetToken();
  const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExp },
  });

  // In production, send email with reset link
  // For now, return the token (in production this would be emailed)
  return {
    message: 'Se o e-mail estiver cadastrado, você receberá as instruções de recuperação.',
    ...(process.env.NODE_ENV === 'development' && { resetToken }),
  };
}

export async function resetPassword(token: string, newPassword: string) {
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExp: { gt: new Date() },
    },
  });

  if (!user) {
    throw { statusCode: 400, message: 'Token inválido ou expirado.' };
  }

  const hashedPassword = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword, resetToken: null, resetTokenExp: null },
  });

  return { message: 'Senha alterada com sucesso.' };
}

export async function refreshAuthToken(refreshToken: string) {
  const { verifyRefreshToken } = await import('../utils/jwt.util');
  const decoded = verifyRefreshToken(refreshToken);

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, email: true, role: true, isActive: true },
  });

  if (!user || !user.isActive || user.role === 'BANNED') {
    throw { statusCode: 401, message: 'Usuário inválido.' };
  }

  const newToken = generateToken({ userId: user.id, email: user.email, role: user.role });
  const newRefreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role });

  return { token: newToken, refreshToken: newRefreshToken };
}
