import { Controller, Post, Body, Param, Req } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post(':postId')
  async createReport(
    @Param('postId') postId: string,
    @Body() body: { reason: string, description?: string, userId?: string },
    @Req() req: any
  ) {
    const userId = req.user?.id || body.userId || "00000000-0000-0000-0000-000000000000";
    return this.reportsService.createReport(postId, userId, body.reason, body.description);
  }
}
