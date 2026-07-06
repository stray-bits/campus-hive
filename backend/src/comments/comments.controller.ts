import { Body, Controller, Get, Param, Post, Req, UseGuards, Patch, Delete } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller()
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('posts/:id/comments')
  createComment(
    @Param('id') postId: string,
    @Req() req: any,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(req.user.userId, postId, dto);
  }

  @Get('posts/:id/comments')
  getComments(@Param('id') postId: string) {
    return this.commentsService.getComments(postId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('comments/:id')
  updateComment(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.update(id, req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('comments/:id')
  deleteComment(@Param('id') id: string, @Req() req: any) {
    return this.commentsService.delete(id, req.user.userId);
  }
}
