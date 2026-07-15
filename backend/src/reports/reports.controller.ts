import { Controller, Get, Post, Body, Param, Req, UseGuards, Patch } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ReviewReportDto } from './dto/review-report.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../common/enums/user-role.enum'

@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('posts/:id')
  reportPost(
    @Param('id') postId: string,
    @Req() req: any,
    @Body() dto: CreateReportDto,
  ) {
    return this.reportsService.reportPost(req.user.userId, postId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('comments/:id')
  reportComment(
    @Param('id') commentId: string,
    @Req() req: any,
    @Body() dto: CreateReportDto,
  ) {
    return this.reportsService.reportComment(req.user.userId, commentId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('users/:id')
  reportUser(
    @Param('id') userId: string,
    @Req() req: any,
    @Body() dto: CreateReportDto,
  ) {
    return this.reportsService.reportUser(req.user.userId, userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.SUPER_ADMIN)
  @Get()
  getAllReports() {
    return this.reportsService.getAllReports();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.SUPER_ADMIN)
  @Patch(':id/review')
  reviewReport(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: ReviewReportDto,
  ) {
    return this.reportsService.reviewReport(id, req.user.userId, dto);
  }
}

//   @Patch('reports/posts/:id/status')
//   @Patch('reports/comments/:id/status')
//   @Patch('reports/users/:id/status')
