import { Controller, Body, Get, Post, UseGuards, Query, Param, Delete, Patch, Req, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdatePostDto } from './dto/update-post.dto';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { postFilesUploadOptions } from '../common/upload/multer-options';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'video', maxCount: 1 },
        { name: 'attachment', maxCount: 1 },
      ],
      postFilesUploadOptions,
    ),
  )
  create(
    @Req() req: any,
    @Body() dto: CreatePostDto,
    @UploadedFiles()
    files: {
      image?: Express.Multer.File[];
      video?: Express.Multer.File[];
      attachment?: Express.Multer.File[];
    },
  ) {
    return this.postsService.create(req.user.userId, dto, files);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('feed')
  getFeed(@Req() req: any, @Query('category') category?: string) {
    return this.postsService.getFeed(req.user ?? undefined, category);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('search')
  search(@Req() req: any, @Query('q') query: string) {
    return this.postsService.search(query, req.user ?? undefined);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('category/:id')
  getByCategory(@Param('id') id: string, @Req() req: any) {
    return this.postsService.getByCategory(id, req.user ?? undefined);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  getPost(@Param('id') id: string, @Req() req: any) {
    return this.postsService.getPost(id, req.user ?? undefined);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  updatePost(@Param('id') id: string, @Req() req: any, @Body() dto: UpdatePostDto) {
    return this.postsService.updatePost(id, req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deletePost(@Param('id') id: string, @Req() req: any) {
    return this.postsService.deletePost(id, req.user.userId);
  }
}
