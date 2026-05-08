import { Injectable, ForbiddenException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserBlocksService {
  constructor(private prisma: PrismaService) {}

  async blockUser(blockerUserId: string, blockedUserId: string, reason?: string) {
    if (blockerUserId === blockedUserId) {
      throw new ForbiddenException('Kendinizi engelleyemezsiniz.');
    }

    const existing = await this.prisma.userBlock.findUnique({
      where: { blockerUserId_blockedUserId: { blockerUserId, blockedUserId } },
    });

    if (existing) {
      throw new ConflictException('Bu kullanıcı zaten engellendi.');
    }

    return this.prisma.userBlock.create({
      data: { blockerUserId, blockedUserId, reason },
    });
  }

  async unblockUser(blockerUserId: string, blockedUserId: string) {
    const existing = await this.prisma.userBlock.findUnique({
      where: { blockerUserId_blockedUserId: { blockerUserId, blockedUserId } },
    });

    if (!existing) {
      throw new NotFoundException('Engel kaydı bulunamadı.');
    }

    return this.prisma.userBlock.delete({
      where: { id: existing.id },
    });
  }

  async isBlocked(userId1: string, userId2: string): Promise<boolean> {
    const block = await this.prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerUserId: userId1, blockedUserId: userId2 },
          { blockerUserId: userId2, blockedUserId: userId1 },
        ],
      },
    });
    return !!block;
  }

  async getBlockedUsers(userId: string) {
    return this.prisma.userBlock.findMany({
      where: { blockerUserId: userId },
      include: {
        blocked: { select: { id: true, fullName: true, email: true, profileImageUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBlockDirection(userId1: string, userId2: string) {
    const block = await this.prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerUserId: userId1, blockedUserId: userId2 },
          { blockerUserId: userId2, blockedUserId: userId1 },
        ],
      },
    });
    if (!block) return null;
    return { blockerUserId: block.blockerUserId, blockedUserId: block.blockedUserId };
  }
}
