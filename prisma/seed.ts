import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create site settings singleton
  await prisma.siteSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      siteName: 'PostHub',
      description: 'Sua plataforma de postagens moderna',
      theme: 'light',
      primaryColor: '#6366f1',
      secondaryColor: '#8b5cf6',
      fontFamily: 'Inter',
      footerText: '© 2024 PostHub. Todos os direitos reservados.',
      welcomeMessage: 'Bem-vindo ao PostHub!',
    },
  });

  // Create categories
  const categories = [
    { name: 'Tecnologia', slug: 'tecnologia', color: '#6366f1', description: 'Artigos sobre tecnologia e inovação' },
    { name: 'Notícias', slug: 'noticias', color: '#10b981', description: 'Últimas notícias' },
    { name: 'Tutoriais', slug: 'tutoriais', color: '#f59e0b', description: 'Guias e tutoriais' },
    { name: 'Entretenimento', slug: 'entretenimento', color: '#ef4444', description: 'Conteúdo de entretenimento' },
    { name: 'Geral', slug: 'geral', color: '#8b5cf6', description: 'Conteúdo geral' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  console.log('Seed completed successfully!');
  console.log('');
  console.log('To create the first admin (owner) account, register normally through the application.');
  console.log('The first registered user will automatically receive the OWNER role.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
