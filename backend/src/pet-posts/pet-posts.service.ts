import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePetPostDto } from './dto/create-pet-post.dto';
import { PostStatus, Prisma, RequestStatus } from '@prisma/client';

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
          estimatedAgeMonths: createPetPostDto.estimatedAgeMonths ? parseInt(createPetPostDto.estimatedAgeMonths as any, 10) : null,
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

  async findAllActive(filters: { species?: string; city?: string; size?: string; gender?: string }) {
    const whereCondition: Prisma.PetPostWhereInput = {
      status: PostStatus.ACTIVE,
    };

    if (filters.city) {
      whereCondition.city = { equals: filters.city, mode: 'insensitive' };
    }

    if (filters.species || filters.size || filters.gender) {
      whereCondition.pet = {};
      if (filters.species) {
        whereCondition.pet.species = filters.species as any;
      }
      if (filters.size) {
        whereCondition.pet.size = filters.size as any;
      }
      if (filters.gender) {
        whereCondition.pet.gender = filters.gender as any;
      }
    }

    return this.prisma.petPost.findMany({
      where: whereCondition,
      include: {
        pet: true,
        images: true,
        owner: {
          select: { id: true, fullName: true, profileImageUrl: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
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
