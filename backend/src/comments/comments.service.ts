import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { formatComment } from '../common/formatters/post-response.util';
import { resolveMentions } from '../common/utils/mentions.util';
import { isModerator } from '../common/utils/role.util';
import { ensureUserNotSuspended } from '../common/utils/user-status.util';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(authorId: string, postId: string, dto: CreateCommentDto) {
    await ensureUserNotSuspended(this.prisma, authorId);
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    if (post.isHidden) {
      throw new ForbiddenException('This post is no longer available.');
    }
    const resolvedMentions = await resolveMentions(this.prisma, dto.content);
    const comment = await this.prisma.$transaction(async (tx) => {
      const createdComment = await tx.comment.create({
        data: {
          content: dto.content,
          postId,
          authorId,
        },
      });
      if (resolvedMentions.length) {
        await tx.commentMention.createMany({
          data: resolvedMentions.map((mention) => ({
            commentId: createdComment.id,
            userId: mention.userId,
            username: mention.username ?? '',
          })),
          skipDuplicates: true,
        });
      }
      return tx.comment.findUniqueOrThrow({
        where: { id: createdComment.id },
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
      });
    });
    const mentions =
      comment.mentions?.map((mention: any) => ({
        userId: mention.user.id,
        username: mention.user.username,
        displayName:
          [mention.user.firstName, mention.user.lastName].filter(Boolean).join(' ') ||
          mention.user.username,
      })) ?? [];
    return formatComment(comment, mentions);
  }

  async getComments(postId: string, currentUser?: { userId?: string; role?: string }) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });
    if (!post || post.isHidden) {
      throw new NotFoundException('Post not found');
    }
    const where: any = { postId };
    if (!isModerator(currentUser)) {
      where.isHidden = false;
    }
    const comments = await this.prisma.comment.findMany({
      where,
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
      orderBy: { createdAt: 'asc' },
    });
    return comments.map((comment) => {
      const mentions =
        comment.mentions?.map((mention: any) => ({
          userId: mention.user.id,
          username: mention.user.username,
          displayName:
            [mention.user.firstName, mention.user.lastName].filter(Boolean).join(' ') || mention.user.username,
        })) ?? [];
      return formatComment(comment, mentions);
    });
  }

  async update(id: string, authorId: string, dto: UpdateCommentDto) {
    await ensureUserNotSuspended(this.prisma, authorId);
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        post: { select: { id: true, isHidden: true } },
      },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.authorId !== authorId) {
      throw new ForbiddenException('You can only edit your own comments');
    }
    if (comment.isHidden || comment.post.isHidden) {
      throw new ForbiddenException('Hidden comments cannot be edited');
    }
    const nextContent = dto.content !== undefined ? dto.content : comment.content;
    const resolvedMentions = await resolveMentions(this.prisma, nextContent);
    const updatedComment = await this.prisma.$transaction(async (tx) => {
      await tx.comment.update({
        where: { id },
        data: {
          content: dto.content ?? comment.content,
        },
      });
      await tx.commentMention.deleteMany({
        where: { commentId: id },
      });
      if (resolvedMentions.length) {
        await tx.commentMention.createMany({
          data: resolvedMentions.map((mention) => ({
            commentId: id,
            userId: mention.userId,
            username: mention.username ?? '',
          })),
          skipDuplicates: true,
        });
      }
      return tx.comment.findUniqueOrThrow({
        where: { id },
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
      });
    });
    const mentions =
      updatedComment.mentions?.map((mention: any) => ({
        userId: mention.user.id,
        username: mention.user.username,
        displayName:
          [mention.user.firstName, mention.user.lastName].filter(Boolean).join(' ') || mention.user.username,
      })) ?? [];
    return formatComment(updatedComment, mentions);
  }

  async delete(id: string, authorId: string) {
    await ensureUserNotSuspended(this.prisma, authorId);
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.authorId !== authorId) {
      throw new ForbiddenException('You can only delete your own comments');
    }
    await this.prisma.comment.delete({
      where: { id },
    });
    return {
      message: 'Comment deleted successfully',
    };
  }
}
