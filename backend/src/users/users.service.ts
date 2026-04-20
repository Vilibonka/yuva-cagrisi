import { Injectable } from '@nestjs/common';
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

    async createUser(data: Prisma.UserCreateInput): Promise<User> {
        return this.prisma.user.create({
            data,
        });
    }

    async findById(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
            select: { id: true, fullName: true, email: true, phone: true, city: true, district: true, bio: true, role: true, createdAt: true, isActive: true }
        });
    }

    async updateProfile(id: string, data: any) {
        return this.prisma.user.update({
            where: { id },
            data,
            select: { id: true, fullName: true, email: true, phone: true, city: true, district: true, bio: true }
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
