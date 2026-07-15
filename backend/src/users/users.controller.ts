import { Body, Controller, Get, Patch, Query, Req, UseGuards, Param, UploadedFile, UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { avatarUploadOptions } from '../common/upload/multer-options';
import { RolesGuard } from '../auth/roles.guard';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: any) {
    return this.usersService.findById(req.user.userId, req.user);
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
    return this.usersService.getUserPosts(id, req.user ?? undefined);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  getUser(@Param('id') id: string, @Req() req: any) {
    return this.usersService.findById(id, req.user ?? undefined);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Patch(':id/role')
  setRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.usersService.setRole(id, dto.role);
  }
}
