import { Controller, Body, Get, Post, Request, UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('posts')
export class PostsController {
  constructor(private postsService:PostsService) {}

  @UseGuards(JwtAuthGuard) @Post()
  create(@Request() req, @Body() dto: CreatePostDto) {
    return this.postsService.create(
      req.user.sub,
      dto,
    );
  }

  @Get('feed')
  getFeed() {
    return this.postsService.getFeed();
  }
}
