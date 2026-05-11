import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async findByPhone(contactPhone: string): Promise<User | null> {
        return this.prisma.user.findFirst({
            where: { contactPhone },
        });
    }

    async createUser(data: Prisma.UserCreateInput): Promise<User> {
        return this.prisma.user.create({
            data,
        });
    }

    async findById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: { 
                id: true, fullName: true, email: true, contactPhone: true,
                city: { select: { name: true } },
                district: true, biography: true, role: true, profileImageUrl: true, 
                createdAt: true, isActive: true, lastSeenAt: true,
                showReadReceipts: true, showLastSeen: true
            } as any
        });
        if (!user) return null;
        const { city, ...rest } = user as any;
        return {
            ...rest,
            city: city?.name || null
        };
    }

    async updateProfile(id: string, data: any) {
        // Uniqueness checks
        if (data.email) {
            const existingWithEmail = await this.prisma.user.findFirst({
                where: { email: data.email, NOT: { id } }
            });
            if (existingWithEmail) {
                throw new ConflictException('Bu e-posta adresi zaten kullanımda');
            }
        }

        if (data.contactPhone) {
            const existingWithPhone = await this.prisma.user.findFirst({
                where: { contactPhone: data.contactPhone, NOT: { id } }
            });
            if (existingWithPhone) {
                throw new ConflictException('Bu telefon numarası zaten kullanımda');
            }
        }

        let cityId = undefined;
        if (data.city) {
            const cityRecord = await this.prisma.city.findFirst({
                where: { name: { equals: data.city, mode: 'insensitive' } }
            });
            if (cityRecord) {
                cityId = cityRecord.id;
            }
        }

        const updatedData = { ...data };
        delete updatedData.city;
        if (cityId !== undefined) {
            updatedData.cityId = cityId;
        }

        const user = await this.prisma.user.update({
            where: { id },
            data: updatedData as any,
            select: { 
                id: true, fullName: true, email: true, contactPhone: true,
                city: { select: { name: true } },
                district: true, biography: true, profileImageUrl: true, createdAt: true,
                lastSeenAt: true, showReadReceipts: true, showLastSeen: true
            } as any
        });
        const { city, ...rest } = user as any;
        return {
            ...rest,
            city: city?.name || null
        };
    }

    async updateLastSeen(id: string) {
        return this.prisma.user.update({
            where: { id },
            data: { lastSeenAt: new Date() } as any
        });
    }

    async getPrivacySettings(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
            select: { showReadReceipts: true, showLastSeen: true } as any
        });
    }

    async toggleSavedPost(userId: string, postId: string) {
        const existing = await this.prisma.savedPost.findUnique({
            where: { userId_postId: { userId, postId } }
        });

        if (existing) {
            await this.prisma.savedPost.delete({ where: { id: existing.id } });
            return { saved: false };
        } else {
            await this.prisma.savedPost.create({ data: { userId, postId } });
            return { saved: true };
        }
    }

    async getSavedPosts(userId: string) {
        return this.prisma.savedPost.findMany({
            where: { userId },
            include: {
                post: {
                    include: {
                        pet: true,
                        images: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
}
