import { Controller, Post, Delete, Param, Req, UseGuards, Get } from '@nestjs/common';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('posts')
export class LikesController {
  constructor(private likesService: LikesService) {}

  @UseGuards(JwtAuthGuard) @Post(':id/like')
  like(@Param('id') postId: string, @Req() req: any) {
    return this.likesService.likePost(req.user.userId, postId);
  }

  @UseGuards(JwtAuthGuard) @Delete(':id/like')
  unlike(@Param('id') postId: string, @Req() req: any) {
    return this.likesService.unlikePost(req.user.userId, postId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/liked')
  isLiked(@Param('id') postId: string, @Req() req: any) {
    return this.likesService.isLiked(req.user.userId, postId);
  }
}
