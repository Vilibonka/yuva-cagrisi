import { Controller, Get, Patch, Param, UseGuards, NotFoundException, Delete, Query } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { PrismaService } from '../prisma/prisma.service';
import { ReportStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private prisma: PrismaService) {}

  @Get('users')
  async getAllUsers(@Query() query: any) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '50', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.q) {
      where.OR = [
        { fullName: { contains: query.q, mode: 'insensitive' } },
        { email: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    return this.prisma.user.findMany({
      where,
      select: { id: true, fullName: true, email: true, isActive: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    });
  }

  @Patch('users/:id/freeze')
  async freezeUser(@Param('id') id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    
    // Toggle active status
    return this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive }
    });
  }

  @Get('reports')
  async getAllReports(@Query() query: any) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '50', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }

    return this.prisma.postReport.findMany({
      where,
      include: {
        post: {
          select: { id: true, title: true, status: true }
        },
        reportedBy: {
          select: { id: true, fullName: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    });
  }

  @Patch('reports/:id/dismiss')
  async dismissReport(@Param('id') id: string) {
    return this.prisma.postReport.update({
      where: { id },
      data: { status: ReportStatus.DISMISSED }
    });
  }

  @Patch('reports/:id/remove-post')
  async removePostByReport(@Param('id') id: string) {
    const report = await this.prisma.postReport.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');

    // We mark the report as REviewed
    await this.prisma.postReport.update({
      where: { id },
      data: { status: ReportStatus.REVIEWED }
    });

    // Hard delete post (Prisma will automatically cascade delete PostReports if configured, 
    // but in schema it does have onDelete: Cascade for post relation)
    // Actually, hard delete may wipe the report too. So let's soft delete the post or actually hard delete it.
    // The prompt says: "Admin can edit or delete any pet post". Let's perform a true Hard Delete on the petPost to clean up.
    return this.prisma.petPost.delete({
      where: { id: report.postId }
    });
  }

  @Delete('posts/:id')
  async deletePost(@Param('id') id: string) {
    return this.prisma.petPost.delete({
      where: { id }
    });
  }
}
