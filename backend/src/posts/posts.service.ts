import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import * as fs from 'fs';
import { join } from 'path';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  private postSelect(userId?: string) {
    return {
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
      ...(userId
        ? {
            likes: { where: { userId }, select: { id: true } },
            bookmarks: { where: { userId }, select: { id: true } },
          }
        : {}),
    };
  }

  private formatPost(post: any, userId?: string) {
    return {
      id: post.id,
      content: post.content,
      imageUrl: post.imageUrl,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      category: post.category,
      author: post.author,
      counts: {
        likes: post._count?.likes ?? 0,
        comments: post._count?.comments ?? 0,
        bookmarks: post._count?.bookmarks ?? 0,
      },
      ...(userId
        ? {
            likedByMe: (post.likes?.length ?? 0) > 0,
            bookmarkedByMe: (post.bookmarks?.length ?? 0) > 0,
          }
        : {}),
    };
  }

  async create(authorId: string, dto: CreatePostDto, image?: Express.Multer.File) {
    const generalCategory = await this.prisma.category.findFirst({
      where: { name: 'General' },
    });
    if (!generalCategory) {
      throw new NotFoundException('Default category "General" not found');
    }
    const post = await this.prisma.post.create({
      data: {
        content: dto.content,
        authorId,
        categoryId: dto.categoryId ?? generalCategory.id,
        imageUrl: image ? `/uploads/posts/${image.filename}` : null,
      },
      select: this.postSelect(authorId),
    });
    return this.formatPost(post, authorId);
  }

  async getFeed(userId?: string, category?: string) {
    const posts = await this.prisma.post.findMany({
      where: category ? { category: { name: category }} : {},
      select: this.postSelect(userId),
      orderBy: { createdAt: 'desc' },
    });
    return posts.map((post) => this.formatPost(post, userId));
  }

  async search(query: string, userId?: string) {
    if (!query?.trim()) {
      throw new BadRequestException('Search query is required');
    }
    const posts = await this.prisma.post.findMany({
      where: {
        OR: [
          { content: { contains: query, mode: 'insensitive' } },
          { category: { name: { contains: query, mode: 'insensitive' } } },
          { author: { username: { contains: query, mode: 'insensitive' } } },
          { author: { firstName: { contains: query, mode: 'insensitive' } } },
          { author: { lastName: { contains: query, mode: 'insensitive' } } },
        ],
      },
      select: this.postSelect(userId),
      orderBy: { createdAt: 'desc' },
    });
    return posts.map((post) => this.formatPost(post, userId));
  }

  async getByCategory(categoryId: string, userId?: string) {
    const posts = await this.prisma.post.findMany({
      where: { categoryId },
      select: this.postSelect(userId),
      orderBy: { createdAt: 'desc' },
    });
    return posts.map((post) => this.formatPost(post, userId));
  }

  async getPost(id: string, userId?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      select: {
        ...this.postSelect(userId),
        comments: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return {
      ...this.formatPost(post, userId),
      comments: post.comments,
    };
  }

  async updatePost(postId: string, userId: string, dto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own posts');
    }
    const updated = await this.prisma.post.update({
      where: { id: postId },
      data: dto,
      select: this.postSelect(userId),
    });
    return this.formatPost(updated, userId);
  }

  async deletePost(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }
    // delete uploaded image file if post has one
    if (post.imageUrl) {
      const filePath = join(process.cwd(), post.imageUrl.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    await this.prisma.post.delete({
      where: { id: postId },
    });
    return {
      message: 'Post deleted successfully',
    };
  }
}
