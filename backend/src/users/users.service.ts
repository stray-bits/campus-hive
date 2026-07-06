import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { formatPost } from '../common/formatters/post-response.util';
import { join } from 'path';
import * as fs from 'fs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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
    return this.prisma.user.create({
      data,
    });
  }

  async findMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        bio: true,
        department: true,
        graduationYear: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
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

  async getUserPosts(userId: string, currentUserId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const posts = await this.prisma.post.findMany({
      where: { authorId: userId },
      include: {
        category: true,
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
        likes: {
          select: { userId: true },
        },
        bookmarks: {
          select: { userId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return posts.map((post) => formatPost(post, currentUserId));
  }
}
