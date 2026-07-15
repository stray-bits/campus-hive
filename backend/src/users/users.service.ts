import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { formatPost } from '../common/formatters/post-response.util';
import { join } from 'path';
import * as fs from 'fs';
import { isModerator } from '../common/utils/role.util';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private readonly privateUserSelect = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    username: true,
    bio: true,
    department: true,
    graduationYear: true,
    avatarUrl: true,
    createdAt: true,
    role: true,
    isSuspended: true,
  } as const;
  private readonly publicUserSelect = {
    id: true,
    firstName: true,
    lastName: true,
    username: true,
    bio: true,
    department: true,
    graduationYear: true,
    avatarUrl: true,
    createdAt: true,
  } as const;

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  create(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    return this.prisma.user.create({ data });
  }

  async findById(id: string, currentUser?: { userId?: string; role?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.privateUserSelect,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const isSelf = currentUser?.userId === user.id;
    if (isSelf || isModerator(currentUser)) {
      return user;
    }
    const publicUser = await this.prisma.user.findUnique({
      where: { id },
      select: this.publicUserSelect,
    });
    return publicUser;
  }

  async updateProfile(
    userId: string,
    data: {
      username?: string;
      bio?: string;
      department?: string;
      graduationYear?: number;
    },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        username: true,
        bio: true,
        department: true,
        graduationYear: true,
        avatarUrl: true,
        createdAt: true,
        role: true,
        isSuspended: true,
      },
    });
  }

  async uploadAvatar(userId: string, avatar?: Express.Multer.File) {
    if (!avatar) {
      throw new BadRequestException('Avatar image is required');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.avatarUrl) {
      const oldAvatarPath = join(process.cwd(), user.avatarUrl.replace(/^\//, ''));
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: `/uploads/avatars/${avatar.filename}` },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        avatarUrl: true,
      },
    });
  }

  async search(query: string) {
    return this.prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { username: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        bio: true,
        department: true,
        graduationYear: true,
        avatarUrl: true,
      },
      take: 20,
    });
  }

  async getUserPosts(userId: string, currentUser?: { userId?: string; role?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const where: any = { authorId: userId };
    if (!isModerator(currentUser)) {
      where.isHidden = false;
    }
    const posts = await this.prisma.post.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            bookmarks: true,
          },
        },
        likes: currentUser?.userId
          ? {
              where: { userId: currentUser.userId },
              select: { userId: true },
            }
          : { select: { userId: true } },
        bookmarks: currentUser?.userId
          ? {
              where: { userId: currentUser.userId },
              select: { userId: true },
            }
          : { select: { userId: true } },
        mentions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return posts.map((post) => formatPost(post, currentUser));
  }

  async setRole(userId: string, role: UserRole) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        role: true,
      },
    });
  }
}
