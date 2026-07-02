import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LikesService {
  constructor(private prisma: PrismaService) {}

  async likePost(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    const existingLike = await this.prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    if (existingLike) {
      throw new ConflictException('Post already liked');
    }
    return this.prisma.like.create({
      data: { userId, postId },
    });
  }

  async unlikePost(userId: string, postId: string) {
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
      message: 'Post unliked successfully',
    };
  }

  async isLiked(userId: string, postId: string) {
    const like = await this.prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    return { liked: !!like };
  }
}
