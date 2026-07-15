import { ConflictException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ensureUserNotSuspended } from '../common/utils/user-status.util';
import { ReportReason } from '../common/enums/report-reason.enum';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async reportPost(
    reporterId: string,
    postId: string,
    dto: { reason: ReportReason; details?: string },
  ) {
    await ensureUserNotSuspended(this.prisma, reporterId);
    const existing = await this.prisma.report.findFirst({
      where: { reporterId, postId },
    });
    if (existing) {
      throw new ConflictException('You have already reported this post');
    }
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.isHidden) {
      throw new ForbiddenException('This post is no longer available.');
    }
    return this.prisma.report.create({
      data: {
        reporterId,
        targetType: 'POST',
        postId,
        reason: dto.reason,
        details: dto.details,
      },
    });
  }

  async reportComment(
    reporterId: string,
    commentId: string,
    dto: { reason: ReportReason; details?: string },
  ) {
    await ensureUserNotSuspended(this.prisma, reporterId);
    const existing = await this.prisma.report.findFirst({
      where: { reporterId, commentId },
    });
    if (existing) {
      throw new ConflictException('You have already reported this comment');
    }
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.isHidden) {
      throw new ForbiddenException('This comment is no longer available.');
    }
    return this.prisma.report.create({
      data: {
        reporterId,
        targetType: 'COMMENT',
        commentId,
        reason: dto.reason,
        details: dto.details,
      },
    });
  }

  async reportUser(
    reporterId: string,
    targetUserId: string,
    dto: { reason: ReportReason; details?: string },
  ) {
    await ensureUserNotSuspended(this.prisma, reporterId);
    if (reporterId === targetUserId) {
      throw new ConflictException('You cannot report yourself');
    }
    const existing = await this.prisma.report.findFirst({
      where: { reporterId, targetUserId },
    });
    if (existing) {
      throw new ConflictException('You have already reported this user');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.isSuspended) throw new ForbiddenException('This account is no longer available');
    return this.prisma.report.create({
      data: {
        reporterId,
        targetType: 'USER',
        targetUserId,
        reason: dto.reason,
        details: dto.details,
      },
    });
  }

  async getAllReports() {
    return this.prisma.report.findMany({
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        reviewedBy: {
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
            isHidden: true,
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
            isHidden: true,
          },
        },
        targetUser: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            isSuspended: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewReport(
    reportId: string,
    reviewerId: string,
    dto: { status: 'REVIEWED' | 'RESOLVED' | 'DISMISSED'; resolutionNote?: string },
  ) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });
    if (!report) throw new NotFoundException('Report not found');
    return this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: dto.status,
        resolutionNote: dto.resolutionNote,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
      },
    });
  }
}
