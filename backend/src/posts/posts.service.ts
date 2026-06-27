import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  create(authorId: string, dto: CreatePostDto) {
    const generalCategory = await this.prisma.category.findUnique({
      where: { name: 'General' },
    });

    return this.prisma.post.create({
      data: {
        content: dto.content,
        authorId,
        categoryId: dto.categoryId ?? generalCategory.id,
      },
    });
  }

  getFeed(category?: string) {
    return this.prisma.post.findMany({
      where: category ? {
        category: { name: category },
      } : {},
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
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async search(query: string) {
    return this.prisma.post.findMany({
      where: { content: { contains: query, mode: 'insensitive' }},
      include: {
        author: true,
        category: true,
        _count: { select: { likes: true, comments: true }},
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getByCategory(categoryId: string) {
    return this.prisma.post.findMany({
      where: { categoryId },
      include: {
        author: true,
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
