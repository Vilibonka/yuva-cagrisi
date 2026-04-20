import { Controller, Get, Param, Patch, Body, Post, Req } from '@nestjs/common';
import { MessagesService } from './messages.service';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get(':id/messages')
  async getMessages(@Param('id') conversationId: string, @Req() req: any) {
    const userId = req.user?.id || req.body.userId || "00000000-0000-0000-0000-000000000000";
    return this.messagesService.getConversationMessages(userId, conversationId);
  }

  @Patch('messages/:messageId/soft-delete')
  async softDeleteMessage(@Param('messageId') messageId: string, @Req() req: any) {
    // Basic fallback for testing without auth
    const userId = req.user?.id || req.body.userId || "00000000-0000-0000-0000-000000000000";
    return this.messagesService.softDeleteMessage(userId, messageId);
  }

  @Post()
  async findOrCreateConversation(
    @Body() body: { targetUserId: string, postId?: string, userId?: string },
    @Req() req: any
  ) {
    const userId = req.user?.id || body.userId || "00000000-0000-0000-0000-000000000000";
    return this.messagesService.findOrCreateConversation(userId, body.targetUserId, body.postId);
  }
}
