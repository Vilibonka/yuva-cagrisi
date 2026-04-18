import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PetPostsService } from '../pet-posts/pet-posts.service';
import { PostStatus, ReportStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private petPostsService: PetPostsService
  ) { }

  async createReport(postId: string, reportedByUserId: string, reason: string, description?: string) {
    // Enforce one report per user per post manually to ensure beautiful error message
    const existing = await this.prisma.postReport.findFirst({
      where: {
        postId,
        reportedByUserId
      }
    });

    if (existing) {
      throw new BadRequestException('You have already reported this post.');
    }

    const report = await this.prisma.postReport.create({
      data: {
        postId,
        reportedByUserId,
        reason,
        description,
        status: ReportStatus.OPEN
      }
    });

    // Threshold Check
    const count = await this.prisma.postReport.count({
      where: { postId }
    });

    if (count >= 5) {
      // It must be automatically suspended (PENDING).
      // We assume an admin ID or a system action. Since the petPostsService logic checks for ownership, we bypass by updating directly via prisma.
      await this.prisma.petPost.update({
        where: { id: postId },
        data: { status: PostStatus.PENDING }
      });
    }

    return report;
  }
}
