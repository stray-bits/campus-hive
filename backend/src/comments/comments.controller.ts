import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('posts')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @UseGuards(JwtAuthGuard) @Post(':id/comments')
  createComment(
    @Param('id') postId: string,
    @Req() req: any,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(req.user.sub, postId, dto);
  }

  @Get(':id/comments')
  getComments(@Param('id') postId: string) {
    return this.commentsService.getComments(postId);
  }
}