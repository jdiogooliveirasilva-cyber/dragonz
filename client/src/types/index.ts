export type Role = 'OWNER' | 'ADMIN' | 'USER' | 'BANNED';
export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  bio?: string;
  createdAt: string;
  lastSeen?: string;
  commentsCount?: number;
  likesGiven?: number;
  postsCount?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  status: PostStatus;
  isPinned: boolean;
  publishAt?: string;
  imageUrls: string[];
  videoUrls: string[];
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  author: Pick<User, 'id' | 'name' | 'avatar' | 'role'>;
  category?: Category;
  tags: Tag[];
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
}

export interface Comment {
  id: string;
  content: string;
  isPinned: boolean;
  postId: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  author: Pick<User, 'id' | 'name' | 'avatar' | 'role'>;
  replies?: Comment[];
  likesCount: number;
  repliesCount: number;
  isLiked: boolean;
}

export interface SiteSettings {
  id: string;
  siteName: string;
  description: string;
  logo?: string;
  favicon?: string;
  theme: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  footerText: string;
  socialLinks: Record<string, string>;
  bannerImages: string[];
  sidebarImages: string[];
  backgroundImage?: string;
  welcomeMessage: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface DashboardStats {
  stats: {
    totalUsers: number;
    totalAdmins: number;
    totalPosts: number;
    totalComments: number;
    totalLikes: number;
    totalBanned: number;
    onlineUsers: number;
  };
  recentPosts: Post[];
  recentUsers: User[];
  charts: {
    postsPerDay: { date: string; count: number }[];
    usersPerDay: { date: string; count: number }[];
  };
}
