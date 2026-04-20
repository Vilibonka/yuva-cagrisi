import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePetPostDto } from './dto/create-pet-post.dto';
import { PostStatus, Prisma } from '@prisma/client';

@Injectable()
export class PetPostsService {
  constructor(private prisma: PrismaService) {}

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
          select: { id: true, fullName: true, profileImageUrl: true, phone: true, email: true },
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

    return this.prisma.petPost.update({
      where: { id: postId },
      data: { status, closedAt: (status === PostStatus.CLOSED || status === PostStatus.ADOPTED) ? new Date() : null },
      include: { pet: true, images: true }
    });
  }
}
