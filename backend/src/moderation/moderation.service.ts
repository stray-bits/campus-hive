import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HidePostDto } from './dto/hide-post.dto';
import { HideCommentDto } from './dto/hide-comment.dto';
import { SuspendUserDto } from './dto/suspend-user.dto';
import { formatPost, formatComment } from '../common/formatters/post-response.util';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class ModerationService {
  constructor(private prisma: PrismaService) {}

  async getDashboardSummary() {
    const [
      pendingReports,
      recentReports,
      hiddenPostsCount,
      hiddenCommentsCount,
      suspendedUsersCount,
    ] = await Promise.all([
      this.prisma.report.count({
        where: { status: { in: ['PENDING', 'OPEN'] } },
      }),
      this.prisma.report.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          reporter: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          post: {
            select: {
              id: true,
              content: true,
              isAnonymous: true,
            },
          },
          comment: {
            select: {
              id: true,
              content: true,
            },
          },
        },
      }),
      this.prisma.post.count({ where: { isHidden: true } }),
      this.prisma.comment.count({ where: { isHidden: true } }),
      this.prisma.user.count({ where: { isSuspended: true } }),
    ]);
    return {
      summary: {
        pendingReports,
        hiddenPosts: hiddenPostsCount,
        hiddenComments: hiddenCommentsCount,
        suspendedUsers: suspendedUsersCount,
      },
      recentReports: recentReports.map((report) => ({
        id: report.id,
        targetType: report.targetType,
        reason: report.reason,
        details: report.details,
        status: report.status,
        createdAt: report.createdAt,
        reporter: report.reporter
          ? {
              id: report.reporter.id,
              username: report.reporter.username,
              displayName:
                [report.reporter.firstName, report.reporter.lastName].filter(Boolean).join(' ') || report.reporter.username,
            }
          : null,
        target: report.post
          ? {
              type: 'POST',
              id: report.post.id,
              preview: report.post.content,
              isAnonymous: report.post.isAnonymous,
            }
          : report.comment
            ? {
                type: 'COMMENT',
                id: report.comment.id,
                preview: report.comment.content,
              }
            : {
                type: 'USER',
                id: report.targetUserId,
              },
      })),
    };
  }

  async getHiddenPosts(actorId: string) {
    const posts = await this.prisma.post.findMany({
      where: { isHidden: true },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        content: true,
        authorId: true,
        isAnonymous: true,
        isHidden: true,
        imageUrl: true,
        videoUrl: true,
        attachmentUrl: true,
        attachmentName: true,
        attachmentMimeType: true,
        createdAt: true,
        updatedAt: true,
        hiddenReason: true,
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
        _count: {
          select: {
            likes: true,
            comments: true,
            bookmarks: true,
            reports: true,
          },
        },
        likes: { select: { userId: true } },
        bookmarks: { select: { userId: true } },
      },
    });
    return posts.map((post) =>
      formatPost(post, { userId: actorId, role: UserRole.MODERATOR }),
    );
  }

  async getHiddenComments() {
    const comments = await this.prisma.comment.findMany({
      where: { isHidden: true },
      orderBy: { updatedAt: 'desc' },
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

  async getSuspendedUsers() {
    return this.prisma.user.findMany({
      where: { isSuspended: true },
      orderBy: { suspendedAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        role: true,
        avatarUrl: true,
        isSuspended: true,
        suspendedAt: true,
        suspensionReason: true,
      },
    });
  }

  async hidePost(postId: string, dto: HidePostDto) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return this.prisma.post.update({
      where: { id: postId },
      data: {
        isHidden: true,
        hiddenAt: new Date(),
        hiddenReason: dto.reason ?? null,
      },
      select: {
        id: true,
        isHidden: true,
        hiddenAt: true,
        hiddenReason: true,
      },
    });
  }

  async unhidePost(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return this.prisma.post.update({
      where: { id: postId },
      data: {
        isHidden: false,
        hiddenAt: null,
        hiddenReason: null,
      },
      select: {
        id: true,
        isHidden: true,
      },
    });
  }

  async hideComment(commentId: string, dto: HideCommentDto) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    return this.prisma.comment.update({
      where: { id: commentId },
      data: {
        isHidden: true,
        hiddenAt: new Date(),
        hiddenReason: dto.reason ?? null,
      },
      select: {
        id: true,
        isHidden: true,
        hiddenAt: true,
        hiddenReason: true,
      },
    });
  }

  async unhideComment(commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    return this.prisma.comment.update({
      where: { id: commentId },
      data: {
        isHidden: false,
        hiddenAt: null,
        hiddenReason: null,
      },
      select: {
        id: true,
        isHidden: true,
      },
    });
  }

  async suspendUser(actorId: string, userId: string, dto: SuspendUserDto) {
    const actor = await this.prisma.user.findUnique({
      where: { id: actorId },
      select: { id: true, role: true },
    });
    if (!actor) throw new NotFoundException('Moderator account not found');
    const target = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        isSuspended: true,
      },
    });
    if (!target) {
      throw new NotFoundException('User not found');
    }
    if (target.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Super admin cannot be suspended');
    }
    if (target.role === UserRole.MODERATOR && actor.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admin can suspend moderators');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isSuspended: true,
        suspendedAt: new Date(),
        suspensionReason: dto.reason ?? null,
      },
      select: {
        id: true,
        username: true,
        role: true,
        isSuspended: true,
        suspendedAt: true,
        suspensionReason: true,
      },
    });
  }

  async unsuspendUser(actorId: string, userId: string) {
    const actor = await this.prisma.user.findUnique({
      where: { id: actorId },
      select: { id: true, role: true },
    });
    if (!actor) throw new NotFoundException('Moderator account not found');
    const target = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
      },
    });
    if (!target) {
      throw new NotFoundException('User not found');
    }
    if (target.role === UserRole.MODERATOR && actor.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admin can unsuspend moderators');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isSuspended: false,
        suspendedAt: null,
        suspensionReason: null,
      },
      select: {
        id: true,
        username: true,
        role: true,
        isSuspended: true,
      },
    });
  }
}
