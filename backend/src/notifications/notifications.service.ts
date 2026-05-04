import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationType, RequestStatus } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}

  async createStatusChangeNotification(
    userId: string,
    requestId: string,
    status: RequestStatus,
  ) {
    let type: NotificationType = NotificationType.SYSTEM;
    let title = 'Başvuru Durumu Güncellendi';
    let message = `Başvurunuzun durumu ${status} olarak güncellendi.`;

    if (status === RequestStatus.APPROVED) {
      type = NotificationType.REQUEST_APPROVED;
      title = 'Başvurunuz Onaylandı! 🎉';
      message = 'Sahiplenme başvurunuz onaylanmıştır. İlan sahibi sizinle iletişime geçecektir.';
    } else if (status === RequestStatus.REJECTED) {
      type = NotificationType.REQUEST_REJECTED;
      title = 'Başvurunuz Reddedildi';
      message = 'Maalesef sahiplenme başvurunuz ilan sahibi tarafından reddedildi.';
    }

    const notification = await this.prisma.notification.create({
      data: {
        userId,
        requestId,
        type,
        title,
        message,
      },
    });

    // Emit via WebSocket in real-time
    this.gateway.sendNotificationToUser(userId, notification);

    return notification;
  }

  async createNewRequestNotification(
    ownerUserId: string,
    requestId: string,
    applicantName: string,
    postTitle: string,
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: ownerUserId,
        requestId,
        type: NotificationType.REQUEST_CREATED,
        title: 'Yeni Sahiplenme Başvurusu! 🐾',
        message: `${applicantName}, "${postTitle}" ilanınız için bir sahiplenme başvurusunda bulundu.`,
      },
    });

    this.gateway.sendNotificationToUser(ownerUserId, notification);
    return notification;
  }

  async createNewMessageNotification(
    targetUserId: string,
    senderName: string,
  ) {
    // Don't save to DB — just emit a WebSocket event for the message badge
    const payload = {
      type: NotificationType.NEW_MESSAGE,
      title: 'Yeni Mesaj ✉️',
      message: `${senderName} size yeni bir mesaj gönderdi.`,
    };

    this.gateway.sendNotificationToUser(targetUserId, payload);
  }

  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId, type: { not: NotificationType.NEW_MESSAGE } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, isRead: false, type: { not: NotificationType.NEW_MESSAGE } }
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
  }

  async markAsRead(notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }
}
