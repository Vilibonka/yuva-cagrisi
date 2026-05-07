import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MessageStatus, UserReportReason } from '@prisma/client';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) {}

  // ───── Block / Unblock ─────

  async blockUser(blockerUserId: string, blockedUserId: string) {
    if (blockerUserId === blockedUserId) {
      throw new BadRequestException('Kendinizi engelleyemezsiniz.');
    }

    const existing = await this.prisma.userBlock.findUnique({
      where: { blockerUserId_blockedUserId: { blockerUserId, blockedUserId } }
    });
    if (existing) {
      throw new BadRequestException('Bu kullanıcı zaten engellenmiş.');
    }

    return this.prisma.userBlock.create({
      data: { blockerUserId, blockedUserId }
    });
  }

  async unblockUser(blockerUserId: string, blockedUserId: string) {
    const existing = await this.prisma.userBlock.findUnique({
      where: { blockerUserId_blockedUserId: { blockerUserId, blockedUserId } }
    });
    if (!existing) {
      throw new NotFoundException('Engel kaydı bulunamadı.');
    }

    return this.prisma.userBlock.delete({
      where: { id: existing.id }
    });
  }

  async isBlocked(userId1: string, userId2: string): Promise<boolean> {
    const block = await this.prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerUserId: userId1, blockedUserId: userId2 },
          { blockerUserId: userId2, blockedUserId: userId1 },
        ]
      }
    });
    return !!block;
  }

  // ───── Report User ─────

  async reportUser(reporterUserId: string, reportedUserId: string, reasons: UserReportReason[], description?: string) {
    if (reporterUserId === reportedUserId) {
      throw new BadRequestException('Kendinizi şikâyet edemezsiniz.');
    }
    if (!reasons || reasons.length === 0) {
      throw new BadRequestException('En az bir şikâyet nedeni seçmelisiniz.');
    }

    return this.prisma.userReport.create({
      data: {
        reporterUserId,
        reportedUserId,
        reasons,
        description: description || null,
      }
    });
  }

  // ───── Delete Conversation ─────

  async deleteConversation(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true }
    });

    if (!conversation) {
      throw new NotFoundException('Sohbet bulunamadı.');
    }

    const isParticipant = conversation.participants.some(p => p.userId === userId);
    if (!isParticipant) {
      throw new ForbiddenException('Bu sohbete erişim yetkiniz yok.');
    }

    // Remove user from conversation
    await this.prisma.conversationParticipant.delete({
      where: {
        conversationId_userId: { conversationId, userId }
      }
    });

    // If no participants left, delete the whole conversation
    const remaining = await this.prisma.conversationParticipant.count({
      where: { conversationId }
    });

    if (remaining === 0) {
      await this.prisma.conversation.delete({ where: { id: conversationId } });
    }

    return { deleted: true };
  }

  // ───── Messages ─────

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

    // Check if blocked by any other participant
    const otherParticipants = conversation.participants.filter(p => p.userId !== senderUserId);
    for (const participant of otherParticipants) {
      const blocked = await this.isBlocked(senderUserId, participant.userId);
      if (blocked) {
        throw new ForbiddenException('Bu kullanıcıyla iletişim kurulamıyor.');
      }
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

  async isConversationParticipant(userId: string, conversationId: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      select: { id: true },
    });

    return !!participant;
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

    // Check block status before creating/finding conversation
    const blocked = await this.isBlocked(userId, targetUserId);
    if (blocked) {
      throw new ForbiddenException('Bu kullanıcıyla iletişim kurulamıyor.');
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
