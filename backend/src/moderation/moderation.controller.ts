import { Controller, Body, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ModerationService } from './moderation.service';
import { HidePostDto } from './dto/hide-post.dto';
import { HideCommentDto } from './dto/hide-comment.dto';
import { SuspendUserDto } from './dto/suspend-user.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MODERATOR, UserRole.SUPER_ADMIN)
@Controller('moderation')
export class ModerationController {
  constructor(private moderationService: ModerationService) {}

  @Get('dashboard')
  getDashboard() {
    return this.moderationService.getDashboardSummary();
  }

  @Get('hidden-posts')
  getHiddenPosts(@Req() req: any) {
    return this.moderationService.getHiddenPosts(req.user.userId);
  }

  @Get('hidden-comments')
  getHiddenComments() {
    return this.moderationService.getHiddenComments();
  }

  @Get('suspended-users')
  getSuspendedUsers() {
    return this.moderationService.getSuspendedUsers();
  }

  @Patch('posts/:id/hide')
  hidePost(@Param('id') postId: string, @Body() dto: HidePostDto) {
    return this.moderationService.hidePost(postId, dto);
  }

  @Patch('posts/:id/unhide')
  unhidePost(@Param('id') postId: string) {
    return this.moderationService.unhidePost(postId);
  }

  @Patch('comments/:id/hide')
  hideComment(@Param('id') commentId: string, @Body() dto: HideCommentDto) {
    return this.moderationService.hideComment(commentId, dto);
  }

  @Patch('comments/:id/unhide')
  unhideComment(@Param('id') commentId: string) {
    return this.moderationService.unhideComment(commentId);
  }

  @Patch('users/:id/suspend')
  suspendUser(@Req() req: any, @Param('id') userId: string, @Body() dto: SuspendUserDto) {
    return this.moderationService.suspendUser(req.user.userId, userId, dto);
  }

  @Patch('users/:id/unsuspend')
  unsuspendUser(@Req() req: any, @Param('id') userId: string) {
    return this.moderationService.unsuspendUser(req.user.userId, userId);
  }
}
