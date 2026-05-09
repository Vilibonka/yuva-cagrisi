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

      let cityRecord = await tx.city.findFirst({
        where: { name: { equals: createPetPostDto.city, mode: 'insensitive' } }
      });

      if (!cityRecord) {
        throw new NotFoundException('Geçersiz şehir adı');
      }

      const post = await tx.petPost.create({
        data: {
          petId: pet.id,
          ownerUserId: userId,
          postType: createPetPostDto.postType,
          title: createPetPostDto.title,
          description: createPetPostDto.description,
          cityId: cityRecord.id,
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
          city: true,
        },
      });

      return {
        ...post,
        city: post.city?.name || 'Bilinmiyor'
      };
    });
  }

  async findMyPosts(userId: string) {
    const posts = await this.prisma.petPost.findMany({
      where: { ownerUserId: userId },
      include: {
        pet: true,
        images: true,
        city: true,
        adoptionRequests: {
          select: { id: true, status: true, applicantUserId: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return posts.map(post => ({
      ...post,
      city: post.city?.name || 'Bilinmiyor'
    }));
  }

  async findAllActive(filters: { species?: string; city?: string; size?: string; gender?: string; q?: string; page?: string; limit?: string }) {
    const whereCondition: Prisma.PetPostWhereInput = {
      status: PostStatus.ACTIVE,
    };

    if (filters.city) {
      whereCondition.city = { name: { equals: filters.city, mode: 'insensitive' } };
    }

    if (filters.q) {
      whereCondition.OR = [
        { title: { contains: filters.q, mode: 'insensitive' } },
        { description: { contains: filters.q, mode: 'insensitive' } },
        { pet: { breed: { contains: filters.q, mode: 'insensitive' } } },
      ];
    }

    if (filters.species || filters.size || filters.gender) {
      whereCondition.pet = whereCondition.pet || {};
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

    const page = Math.max(1, parseInt(filters.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(filters.limit || '50', 10)));
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prisma.petPost.findMany({
        where: whereCondition,
        include: {
          pet: true,
          images: {
            where: { isPrimary: true },
            take: 1
          },
          owner: {
            select: { id: true, fullName: true, profileImageUrl: true }
          },
          city: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.petPost.count({ where: whereCondition })
    ]);

    const data = posts.map(post => ({
      ...post,
      city: post.city?.name || 'Bilinmiyor',
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: skip + posts.length < total
      }
    };
  }

  async findOne(postId: string) {
    const post = await this.prisma.petPost.findUnique({
      where: { id: postId },
      include: {
        pet: true,
        images: true,
        city: true,
        owner: {
          select: { id: true, fullName: true, profileImageUrl: true, contactPhone: true, email: true },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return {
      ...post,
      city: post.city?.name || 'Bilinmiyor'
    };
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
      include: { pet: true, images: true, city: true }
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

    return {
      ...updatedPost,
      city: updatedPost.city?.name || 'Bilinmiyor'
    };
  }
}
