import { Controller, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post(':postId')
  @UseGuards(JwtAuthGuard)
  async createReport(
    @Param('postId') postId: string,
    @Body() body: { reason: string, description?: string },
    @Req() req: any
  ) {
    const userId = req.user.id;
    return this.reportsService.createReport(postId, userId, body.reason, body.description);
  }
}
