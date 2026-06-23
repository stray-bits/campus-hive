import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  create(postId: string, authorId: string, dto: CreateCommentDto) {
    return this.prisma.comment.create({
      data: {
        content: dto.content,
        postId,
        authorId,
      },
    });
  }

  getComments(postId: string) {
    return this.prisma.comment.findMany({
      where: { postId },
      include: { author: true },
      orderBy: { createdAt: 'asc'},
    });
  }
}
