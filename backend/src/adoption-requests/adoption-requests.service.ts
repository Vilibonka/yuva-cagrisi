import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PostStatus, Prisma, RequestStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdoptionRequestDto } from './dto/create-adoption-request.dto';
import { UpdateAdoptionRequestStatusDto } from './dto/update-adoption-request-status.dto';

const adoptionRequestInclude = {
  applicant: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      city: true,
      district: true,
      profileImageUrl: true,
    },
  },
  post: {
    include: {
      pet: true,
      images: true,
      owner: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          profileImageUrl: true,
        },
      },
    },
  },
  statusHistory: {
    include: {
      changedBy: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
    orderBy: {
      changedAt: 'asc',
    },
  },
} satisfies Prisma.AdoptionRequestInclude;

@Injectable()
export class AdoptionRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(applicantUserId: string, createDto: CreateAdoptionRequestDto) {
    const post = await this.prisma.petPost.findUnique({
      where: { id: createDto.postId },
      select: { id: true, ownerUserId: true, status: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.ownerUserId === applicantUserId) {
      throw new ForbiddenException('You cannot apply to your own post');
    }

    if (post.status !== PostStatus.ACTIVE) {
      throw new BadRequestException('Only active posts accept adoption requests');
    }

    const existingRequest = await this.prisma.adoptionRequest.findUnique({
      where: {
        postId_applicantUserId: {
          postId: createDto.postId,
          applicantUserId,
        },
      },
      select: { id: true },
    });

    if (existingRequest) {
      throw new ConflictException('You already applied to this post');
    }

    return this.prisma.$transaction(async (tx) => {
      const request = await tx.adoptionRequest.create({
        data: {
          postId: createDto.postId,
          applicantUserId,
          status: RequestStatus.PENDING,
          message: createDto.message,
          housingType: createDto.housingType,
          hasOtherPets: createDto.hasOtherPets ?? false,
          hasChildren: createDto.hasChildren ?? false,
          experienceWithPets: createDto.experienceWithPets,
          whyAdopt: createDto.whyAdopt,
          contactPhone: createDto.contactPhone,
        },
      });

      await tx.requestStatusHistory.create({
        data: {
          requestId: request.id,
          oldStatus: null,
          newStatus: RequestStatus.PENDING,
          changedByUserId: applicantUserId,
        },
      });

      return tx.adoptionRequest.findUniqueOrThrow({
        where: { id: request.id },
        include: adoptionRequestInclude,
      });
    });
  }

  async getMyRequests(applicantUserId: string, postId?: string) {
    return this.prisma.adoptionRequest.findMany({
      where: {
        applicantUserId,
        ...(postId ? { postId } : {}),
      },
      include: adoptionRequestInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getRequestsForPost(ownerUserId: string, postId: string) {
    await this.assertPostOwnership(postId, ownerUserId);

    return this.prisma.adoptionRequest.findMany({
      where: { postId },
      include: adoptionRequestInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateStatus(
    ownerUserId: string,
    requestId: string,
    updateDto: UpdateAdoptionRequestStatusDto,
  ) {
    const request = await this.prisma.adoptionRequest.findUnique({
      where: { id: requestId },
      include: {
        post: {
          select: {
            id: true,
            ownerUserId: true,
            status: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Adoption request not found');
    }

    if (request.post.ownerUserId !== ownerUserId) {
      throw new ForbiddenException('You can only review requests for your own posts');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be reviewed');
    }

    if (request.post.status !== PostStatus.ACTIVE) {
      throw new BadRequestException('This post is no longer accepting requests');
    }

    return updateDto.status === RequestStatus.APPROVED
      ? this.approveRequest(ownerUserId, requestId, request.post.id, updateDto.note)
      : this.rejectRequest(ownerUserId, requestId, updateDto.note);
  }

  private async approveRequest(ownerUserId: string, requestId: string, postId: string, note?: string) {
    const reviewedAt = new Date();

    return this.prisma.$transaction(async (tx) => {
      const otherPendingRequests = await tx.adoptionRequest.findMany({
        where: {
          postId,
          status: RequestStatus.PENDING,
          NOT: { id: requestId },
        },
        select: { id: true },
      });

      await tx.adoptionRequest.update({
        where: { id: requestId },
        data: {
          status: RequestStatus.APPROVED,
          reviewedAt,
        },
      });

      await tx.requestStatusHistory.create({
        data: {
          requestId,
          oldStatus: RequestStatus.PENDING,
          newStatus: RequestStatus.APPROVED,
          changedByUserId: ownerUserId,
          note: note?.trim() || undefined,
        },
      });

      if (otherPendingRequests.length > 0) {
        await tx.adoptionRequest.updateMany({
          where: {
            id: {
              in: otherPendingRequests.map((pendingRequest) => pendingRequest.id),
            },
          },
          data: {
            status: RequestStatus.REJECTED,
            reviewedAt,
          },
        });

        await tx.requestStatusHistory.createMany({
          data: otherPendingRequests.map((pendingRequest) => ({
            requestId: pendingRequest.id,
            oldStatus: RequestStatus.PENDING,
            newStatus: RequestStatus.REJECTED,
            changedByUserId: ownerUserId,
            note: 'Another application was approved, so this request was rejected automatically.',
          })),
        });
      }

      await tx.petPost.update({
        where: { id: postId },
        data: {
          status: PostStatus.ADOPTED,
          closedAt: reviewedAt,
        },
      });

      return tx.adoptionRequest.findUniqueOrThrow({
        where: { id: requestId },
        include: adoptionRequestInclude,
      });
    });
  }

  private async rejectRequest(ownerUserId: string, requestId: string, note?: string) {
    const reviewedAt = new Date();

    return this.prisma.$transaction(async (tx) => {
      await tx.adoptionRequest.update({
        where: { id: requestId },
        data: {
          status: RequestStatus.REJECTED,
          reviewedAt,
        },
      });

      await tx.requestStatusHistory.create({
        data: {
          requestId,
          oldStatus: RequestStatus.PENDING,
          newStatus: RequestStatus.REJECTED,
          changedByUserId: ownerUserId,
          note: note?.trim() || undefined,
        },
      });

      return tx.adoptionRequest.findUniqueOrThrow({
        where: { id: requestId },
        include: adoptionRequestInclude,
      });
    });
  }

  private async assertPostOwnership(postId: string, ownerUserId: string) {
    const post = await this.prisma.petPost.findUnique({
      where: { id: postId },
      select: {
        id: true,
        ownerUserId: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.ownerUserId !== ownerUserId) {
      throw new ForbiddenException('You can only view requests for your own posts');
    }
  }
}
