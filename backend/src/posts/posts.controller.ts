import { Controller, Body, Get, Post, UseGuards, Query, Param, Delete, Patch, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UpdatePostDto } from './dto/update-post.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';

@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'posts');
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + extname(file.originalname);
          cb(null, uniqueName);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/jpg',
          'image/webp',
        ];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return cb(new Error('Only JPG, PNG, or WEBP images are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  create(
    @Req() req: any,
    @Body() dto: CreatePostDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.postsService.create(req.user.userId, dto, image);
  }

  @UseGuards(JwtAuthGuard)
  @Get('feed')
  getFeed(@Req() req: any) {
    return this.postsService.getFeed(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('search')
  search(@Query('q') query: string, @Req() req: any) {
    return this.postsService.search(query, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('category/:id')
  getByCategory(@Param('id') id: string, @Req() req: any) {
    return this.postsService.getByCategory(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getPost(@Param('id') id: string, @Req() req: any) {
    return this.postsService.getPost(id, req.user.userId);
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
