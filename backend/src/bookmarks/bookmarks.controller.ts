import { Controller, Post, Delete, Get, Param, Req, UseGuards } from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
export class BookmarksController {
  constructor(private bookmarksService: BookmarksService) {}

  @UseGuards(JwtAuthGuard)
  @Post('posts/:id/bookmark')
  addBookmark(@Param('id') postId: string, @Req() req: any) {
    return this.bookmarksService.addBookmark(req.user.userId, postId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('posts/:id/bookmark')
  removeBookmark(@Param('id') postId: string, @Req() req: any) {
    return this.bookmarksService.removeBookmark(req.user.userId, postId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('users/me/bookmarks')
  getMyBookmarks(@Req() req: any) {
    return this.bookmarksService.getUserBookmarks(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('posts/:id/bookmarked')
  isBookmarked(@Param('id') postId: string, @Req() req: any) {
    return this.bookmarksService.isBookmarked(req.user.userId, postId);
  }
}
