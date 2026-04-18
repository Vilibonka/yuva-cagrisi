import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessageStatus } from '@prisma/client';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async createMessage(senderUserId: string, conversationId: string, content: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true }
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Verify user is in conversation
    const isParticipant = conversation.participants.some(p => p.userId === senderUserId);
    if (!isParticipant) {
      throw new ForbiddenException('Not a participant in this conversation');
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderUserId,
        content,
        status: MessageStatus.SENT,
      },
      include: { sender: { select: { id: true, fullName: true } } }
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() }
    });

    return message;
  }

  async softDeleteMessage(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    if (message.senderUserId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { 
        status: MessageStatus.DELETED,
        content: "This message was deleted" 
      }
    });
  }

  async getConversationMessages(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true }
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Verify user is in conversation
    const isParticipant = conversation.participants.some(p => p.userId === userId);
    if (!isParticipant) {
      throw new ForbiddenException('Not a participant in this conversation');
    }

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, fullName: true } } }
    });
  }
}
