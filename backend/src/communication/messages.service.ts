import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MessageStatus } from '@prisma/client';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) {}

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

    // Send notifications to other participants
    const otherParticipants = conversation.participants.filter(p => p.userId !== senderUserId);
    for (const participant of otherParticipants) {
      await this.notificationsService.createNewMessageNotification(
        participant.userId,
        message.sender.fullName
      );
    }

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

  async getUserConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        participants: { some: { userId } }
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, fullName: true, profileImageUrl: true }
            }
          }
        },
        post: {
          select: { id: true, title: true }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, createdAt: true, status: true, senderUserId: true }
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      }
    });
  }

  async findOrCreateConversation(userId: string, targetUserId: string, postId?: string) {
    if (userId === targetUserId) {
      throw new ForbiddenException('You cannot start a conversation with yourself');
    }

    const whereClause: any = {
      AND: [
        { participants: { some: { userId } } },
        { participants: { some: { userId: targetUserId } } }
      ]
    };

    if (postId) {
      whereClause.postId = postId;
    } else {
      whereClause.postId = null;
    }

    const existing = await this.prisma.conversation.findFirst({
      where: whereClause,
      include: { participants: true }
    });

    if (existing) {
      return existing;
    }

    // Create new conversation
    return this.prisma.conversation.create({
      data: {
        postId: postId || null,
        type: postId ? 'POST_RELATED' : 'DIRECT',
        participants: {
          create: [
            { userId },
            { userId: targetUserId }
          ]
        }
      },
      include: { participants: true }
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.message.count({
      where: {
        conversation: {
          participants: { some: { userId } }
        },
        senderUserId: { not: userId },
        status: MessageStatus.SENT
      }
    });
  }

  async markConversationAsRead(userId: string, conversationId: string) {
    // Check if participant
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true }
    });

    if (!conversation || !conversation.participants.some(p => p.userId === userId)) {
      throw new ForbiddenException('Cannot access conversation');
    }

    return this.prisma.message.updateMany({
      where: {
        conversationId,
        senderUserId: { not: userId },
        status: MessageStatus.SENT
      },
      data: { status: MessageStatus.READ }
    });
  }
}
