import { Controller, Post, Delete, Get, Param, Body, Req, UseGuards } from '@nestjs/common';
import { UserBlocksService } from './user-blocks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('user-blocks')
export class UserBlocksController {
  constructor(private readonly userBlocksService: UserBlocksService) {}

  @Post(':targetUserId')
  async blockUser(
    @Param('targetUserId') targetUserId: string,
    @Body() body: { reason?: string },
    @Req() req: any,
  ) {
    return this.userBlocksService.blockUser(req.user.id, targetUserId, body.reason);
  }

  @Delete(':targetUserId')
  async unblockUser(@Param('targetUserId') targetUserId: string, @Req() req: any) {
    return this.userBlocksService.unblockUser(req.user.id, targetUserId);
  }

  @Get()
  async getBlockedUsers(@Req() req: any) {
    return this.userBlocksService.getBlockedUsers(req.user.id);
  }

  @Get('check/:targetUserId')
  async checkBlock(@Param('targetUserId') targetUserId: string, @Req() req: any) {
    const direction = await this.userBlocksService.getBlockDirection(req.user.id, targetUserId);
    return {
      isBlocked: !!direction,
      blockedByMe: direction?.blockerUserId === req.user.id,
      blockedByThem: direction?.blockedUserId === req.user.id,
    };
  }
}
