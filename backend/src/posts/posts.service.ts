import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { formatPost } from '../common/formatters/post-response.util';
import { join } from 'path';
import * as fs from 'fs';
import { resolveMentions } from '../common/utils/mentions.util';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  private postSelect(currentUserId?: string) {
    return {
      id: true,
      content: true,
      imageUrl: true,
      videoUrl: true,
      attachmentUrl: true,
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
        select: {
          likes: true,
          comments: true,
          bookmarks: true,
        },
      },
      likes: currentUserId
        ? {
            where: { userId: currentUserId },
            select: { userId: true },
          }
        : { select: { userId: true } },
      bookmarks: currentUserId
        ? {
            where: { userId: currentUserId },
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
    };
  }

  private postWithCommentsSelect(currentUserId?: string) {
    return {
      ...this.postSelect(currentUserId),
      comments: {
        orderBy: { createdAt: 'asc' as const },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatarUrl: true,
            },
          },
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
      },
    };
  }

  async create(
    authorId: string,
    dto: CreatePostDto,
    files?: {
      image?: Express.Multer.File[];
      video?: Express.Multer.File[];
      attachment?: Express.Multer.File[];
    },
  ) {
    const image = files?.image?.[0];
    const video = files?.video?.[0];
    const attachment = files?.attachment?.[0];
    if (!dto.content?.trim() && !image && !video && !attachment) {
      throw new BadRequestException(
        'Post must contain text, an image, a video, or an attachment',
      );
    }
    const generalCategory = await this.prisma.category.findFirst({
      where: { name: 'General' },
    });
    if (!generalCategory) {
      throw new NotFoundException('Default category "General" not found');
    }
    const resolvedMentions = await resolveMentions(this.prisma, dto.content);
    const attachmentExt = attachment ? attachment.mimetype : null;
    const post = await this.prisma.$transaction(async (tx) => {
      const createdPost = await tx.post.create({
        data: {
          content: dto.content,
          authorId,
          categoryId: dto.categoryId ?? generalCategory.id,
          imageUrl: image ? `/uploads/posts/images/${image.filename}` : null,
          videoUrl: video ? `/uploads/posts/videos/${video.filename}` : null,
          attachmentUrl: attachment ? `/uploads/posts/files/${attachment.filename}` : null,
          attachmentName: attachment ? attachment.originalname : null,
          attachmentMimeType: attachmentExt,
        },
        select: this.postSelect(authorId),
      });
      if (resolvedMentions.length) {
        await tx.postMention.createMany({
          data: resolvedMentions.map((mention) => ({
            postId: createdPost.id,
            userId: mention.userId,
            username: mention.username ?? '',
          })),
          skipDuplicates: true,
        });
      }
      return tx.post.findUniqueOrThrow({
        where: { id: createdPost.id },
        select: this.postSelect(authorId),
      });
    });
    return formatPost(post, authorId);
  }

  async getFeed(currentUserId?: string, category?: string) {
    const posts = await this.prisma.post.findMany({
      where: category ? { category: { name: category } } : {},
      select: this.postSelect(currentUserId),
      orderBy: { createdAt: 'desc' },
    });
    return posts.map((post) => formatPost(post, currentUserId));
  }

  async search(query: string, currentUserId?: string) {
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
      select: this.postSelect(currentUserId),
      orderBy: { createdAt: 'desc' },
    });
    return posts.map((post) => formatPost(post, currentUserId));
  }

  async getByCategory(categoryId: string, currentUserId?: string) {
    const posts = await this.prisma.post.findMany({
      where: { categoryId },
      select: this.postSelect(currentUserId),
      orderBy: { createdAt: 'desc' },
    });
    return posts.map((post) => formatPost(post, currentUserId));
  }

  async getPost(id: string, currentUserId?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      select: this.postWithCommentsSelect(currentUserId),
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return formatPost(post, currentUserId);
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
    const nextContent = dto.content !== undefined ? dto.content : post.content;
    const resolvedMentions = await resolveMentions(this.prisma, nextContent);
    const updatedPost = await this.prisma.$transaction(async (tx) => {
      await tx.post.update({
        where: { id: postId },
        data: dto,
        select: this.postSelect(userId),
      });
      await tx.postMention.deleteMany({
        where: { postId },
      });
      if (resolvedMentions.length) {
        await tx.postMention.createMany({
          data: resolvedMentions.map((mention) => ({
            postId,
            userId: mention.userId,
            username: mention.username ?? '',
          })),
          skipDuplicates: true,
        });
      }
      return tx.post.findUniqueOrThrow({
        where: { id: postId },
        select: this.postSelect(userId),
      });
    });
    return formatPost(updatedPost, userId);
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
    const filePaths = [post.imageUrl, post.videoUrl, post.attachmentUrl].filter(Boolean) as string[];
    for (const fileUrl of filePaths) {
      const filePath = join(process.cwd(), fileUrl.replace(/^\//, ''));
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
