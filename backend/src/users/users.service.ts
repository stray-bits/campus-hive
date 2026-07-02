import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import { join } from 'path';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma['user'].findUnique({
      where: { email },
    });
  }

  create(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    return this.prisma['user'].create({ data });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
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
    // delete old avatar file if it exists
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
      take: 20, //show 20 search results
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
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: { id: true, name: true },
        },
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
          select: { likes: true, comments: true, bookmarks: true },
        },
        ...(currentUserId
          ? {
              likes: { where: { userId: currentUserId }, select: { id: true } },
              bookmarks: { where: { userId: currentUserId }, select: { id: true } },
            }
          : {}),
      },
    });

    return posts.map((post) => ({
      id: post.id,
      content: post.content,
      imageUrl: post.imageUrl,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      category: post.category,
      author: post.author,
      counts: {
        likes: post._count.likes,
        comments: post._count.comments,
        bookmarks: post._count.bookmarks,
      },
      ...(currentUserId
        ? {
            likedByMe: post.likes.length > 0,
            bookmarkedByMe: post.bookmarks.length > 0,
          }
        : {}),
    }));
  }
}
