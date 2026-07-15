import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ensureUserNotSuspended } from '../common/utils/user-status.util';

@Injectable()
export class LikesService {
  constructor(private prisma: PrismaService) {}

  async likePost(userId: string, postId: string) {
    await ensureUserNotSuspended(this.prisma, userId);
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    if (post.isHidden) {
      throw new ForbiddenException('This post is no longer available.');
    }
    const existingLike = await this.prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    if (existingLike) {
      throw new ConflictException('Post already liked');
    }
    await this.prisma.like.create({
      data: { userId, postId },
    });
    return {
      liked: true,
      postId,
      _count: { select: { likes: true, comments: true, bookmarks: true } },
    };
  }

  async unlikePost(userId: string, postId: string) {
    await ensureUserNotSuspended(this.prisma, userId);
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    if (post.isHidden) {
      throw new ForbiddenException('This post is no longer available.');
    }
    const existingLike = await this.prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    if (!existingLike) {
      throw new NotFoundException('Like not found');
    }
    await this.prisma.like.delete({
      where: { userId_postId: { userId, postId } },
    });
    return {
      liked: false,
      postId,
      _count: { select: { likes: true, comments: true, bookmarks: true } },
    };
  }

  async isLiked(userId: string, postId: string) {
    const like = await this.prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    return { postId, liked: !!like };
  }
}
