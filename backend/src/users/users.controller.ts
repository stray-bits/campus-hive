import { Body, Controller, Get, Patch, Query, Req, UseGuards, Param, UploadedFile, UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { avatarUploadOptions } from '../common/upload/multer-options';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: any) {
    return this.usersService.findMe(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/avatar')
  @UseInterceptors(FileInterceptor('avatar', avatarUploadOptions))
  uploadAvatar(@Req() req: any, @UploadedFile() avatar: Express.Multer.File) {
    return this.usersService.uploadAvatar(req.user.userId, avatar);
  }

  @Get('search')
  search(@Query('q') q: string) {
    return this.usersService.search(q);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/posts')
  getUserPosts(@Param('id') id: string, @Req() req: any) {
    return this.usersService.getUserPosts(id, req.user?.userId);
  }

  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }
}
