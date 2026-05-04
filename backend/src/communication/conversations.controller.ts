import { Controller, Get, Param, Patch, Body, Post, Req, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  async getUserConversations(@Req() req: any) {
    const userId = req.user.id;
    return this.messagesService.getUserConversations(userId);
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: any) {
    const count = await this.messagesService.getUnreadCount(req.user.id);
    return { count };
  }

  @Get(':id/messages')
  async getMessages(@Param('id') conversationId: string, @Req() req: any) {
    const userId = req.user.id;
    await this.messagesService.markConversationAsRead(userId, conversationId);
    return this.messagesService.getConversationMessages(userId, conversationId);
  }

  @Patch('messages/:messageId/soft-delete')
  async softDeleteMessage(@Param('messageId') messageId: string, @Req() req: any) {
    const userId = req.user.id;
    return this.messagesService.softDeleteMessage(userId, messageId);
  }

  @Post()
  async findOrCreateConversation(
    @Body() body: { targetUserId: string, postId?: string },
    @Req() req: any
  ) {
    const userId = req.user.id;
    return this.messagesService.findOrCreateConversation(userId, body.targetUserId, body.postId);
  }
}
