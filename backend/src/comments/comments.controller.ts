import { Body, Controller, Get, Param, Post, Req, UseGuards, Patch, Delete } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

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

  @UseGuards(OptionalJwtAuthGuard)
  @Get('posts/:id/comments')
  getComments(@Param('id') postId: string, @Req() req: any) {
    return this.commentsService.getComments(postId, req.user ?? undefined);
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
