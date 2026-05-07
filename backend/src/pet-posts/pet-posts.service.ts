import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePetPostDto } from './dto/create-pet-post.dto';
import { PostStatus, Prisma, RequestStatus } from '@prisma/client';

const AGE_RANGES: Record<string, { min?: number; max?: number }> = {
  AGE_0_6: { min: 0, max: 6 },
  AGE_6_24: { min: 6, max: 24 },
  AGE_24_96: { min: 24, max: 96 },
  AGE_96_PLUS: { min: 96 },
};

const WEIGHT_RANGES: Record<string, { min?: number; max?: number }> = {
  WEIGHT_0_5: { min: 0, max: 5 },
  WEIGHT_5_15: { min: 5, max: 15 },
  WEIGHT_15_30: { min: 15, max: 30 },
  WEIGHT_30_PLUS: { min: 30 },
};

@Injectable()
export class PetPostsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) {}

  async create(userId: string, createPetPostDto: CreatePetPostDto, imageUrls: { url: string, isPrimary: boolean }[]) {
    // We create both Pet and PetPost in a transaction
    return this.prisma.$transaction(async (tx) => {
      const pet = await tx.pet.create({
        data: {
          createdByUserId: userId,
          species: createPetPostDto.species,
          breed: createPetPostDto.breed,
          gender: createPetPostDto.gender,
          estimatedAgeMonths: createPetPostDto.estimatedAgeMonths ?? null,
          weightKg: createPetPostDto.weightKg ?? null,
          size: createPetPostDto.size,
          healthSummary: createPetPostDto.healthSummary,
          temperament: createPetPostDto.temperament,
        },
      });

      const post = await tx.petPost.create({
        data: {
          petId: pet.id,
          ownerUserId: userId,
          postType: createPetPostDto.postType,
          title: createPetPostDto.title,
          description: createPetPostDto.description,
          city: createPetPostDto.city,
          status: PostStatus.ACTIVE,
          images: {
            create: imageUrls.map((img) => ({
              imageUrl: img.url,
              isPrimary: img.isPrimary,
            })),
          },
        },
        include: {
          images: true,
          pet: true,
        },
      });

      return post;
    });
  }

  async findMyPosts(userId: string) {
    return this.prisma.petPost.findMany({
      where: { ownerUserId: userId },
      include: {
        pet: true,
        images: true,
        adoptionRequests: {
          select: { id: true, status: true, applicantUserId: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findAllActive(filters: {
    species?: string;
    city?: string;
    gender?: string;
    size?: string;
    ageRange?: string;
    weightRange?: string;
    page?: string;
    limit?: string;
  }) {
    const whereCondition: Prisma.PetPostWhereInput = {
      status: PostStatus.ACTIVE,
    };

    if (filters.city) {
      whereCondition.city = { contains: filters.city, mode: 'insensitive' };
    }

    if (filters.species || filters.size || filters.gender || filters.ageRange || filters.weightRange) {
      const petWhere: Prisma.PetWhereInput = {};

      if (filters.species) {
        petWhere.species = filters.species as any;
      }
      if (filters.size) {
        petWhere.size = filters.size as any;
      }
      if (filters.gender) {
        petWhere.gender = filters.gender as any;
      }

      const ageRange = filters.ageRange ? AGE_RANGES[filters.ageRange] : undefined;
      if (ageRange) {
        petWhere.estimatedAgeMonths = {
          ...(ageRange.min !== undefined ? { gte: ageRange.min } : {}),
          ...(ageRange.max !== undefined ? { lte: ageRange.max } : {}),
        };
      }

      const weightRange = filters.weightRange ? WEIGHT_RANGES[filters.weightRange] : undefined;
      if (weightRange) {
        petWhere.weightKg = {
          ...(weightRange.min !== undefined ? { gte: weightRange.min } : {}),
          ...(weightRange.max !== undefined ? { lte: weightRange.max } : {}),
        };
      }

      whereCondition.pet = petWhere;
    }

    const page = filters.page ? parseInt(filters.page, 10) : 1;
    const limit = filters.limit ? parseInt(filters.limit, 10) : 12;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.petPost.findMany({
        where: whereCondition,
        include: {
          pet: true,
          images: true,
          owner: {
            select: { id: true, fullName: true, profileImageUrl: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.petPost.count({ where: whereCondition })
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findOne(postId: string) {
    const post = await this.prisma.petPost.findUnique({
      where: { id: postId },
      include: {
        pet: true,
        images: true,
        owner: {
          select: { id: true, fullName: true, profileImageUrl: true, contactPhone: true, email: true },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async updateStatus(userId: string, postId: string, status: PostStatus) {
    const post = await this.prisma.petPost.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    if (post.ownerUserId !== userId) {
      throw new ForbiddenException('You do not have permission to update this post');
    }

    const updatedPost = await this.prisma.petPost.update({
      where: { id: postId },
      data: { status, closedAt: (status === PostStatus.CLOSED || status === PostStatus.ADOPTED) ? new Date() : null },
      include: { pet: true, images: true }
    });

    // If post is closed or adopted, automatically reject any pending applications
    if (status === PostStatus.CLOSED || status === PostStatus.ADOPTED) {
      const pendingRequests = await this.prisma.adoptionRequest.findMany({
        where: { postId, status: RequestStatus.PENDING }
      });

      if (pendingRequests.length > 0) {
        await this.prisma.$transaction(async (tx) => {
          await tx.adoptionRequest.updateMany({
            where: { id: { in: pendingRequests.map(r => r.id) } },
            data: { status: RequestStatus.REJECTED, reviewedAt: new Date() }
          });

          await tx.requestStatusHistory.createMany({
            data: pendingRequests.map(r => ({
              requestId: r.id,
              oldStatus: RequestStatus.PENDING,
              newStatus: RequestStatus.REJECTED,
              changedByUserId: userId,
              note: status === PostStatus.ADOPTED ? 'İlan sahiplendirildiği için başvurunuz otomatik olarak reddedildi.' : 'İlan kapatıldığı için başvurunuz otomatik olarak reddedildi.'
            }))
          });
        });

        // Send notifications
        for (const req of pendingRequests) {
          await this.notificationsService.createStatusChangeNotification(
            req.applicantUserId,
            req.id,
            RequestStatus.REJECTED
          );
        }
      }
    }

    return updatedPost;
  }
}
