import { Controller, Body, Get, Post, Param, Req, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('posts/:postId/comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @UseGuards(JwtAuthGuard) @Post()
  create(
    @Param('postId') postId: string,
    @Req() req: any,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(postId, req.user.sub, dto);
  }

  @Get()
  getComments(@Param('postId') postId: string) {
    return this.commentsService.getComments(postId);
  }
}
