import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards, UseInterceptors, UploadedFiles, Req } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdoptionRequestsService } from '../adoption-requests/adoption-requests.service';
import { PetPostsService } from './pet-posts.service';
import { CreatePetPostDto } from './dto/create-pet-post.dto';
import { UpdatePostStatusDto } from './dto/update-status.dto';

// Standard simple multer configuration for local storage
const storage = diskStorage({
  destination: './uploads/images',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
  },
});

@Controller('pet-posts')
export class PetPostsController {
  constructor(
    private readonly petPostsService: PetPostsService,
    private readonly adoptionRequestsService: AdoptionRequestsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 5, { storage }))
  async create(
    @Req() req: any,
    @Body() createPetPostDto: CreatePetPostDto,
    @UploadedFiles() files: Array<Express.Multer.File>
  ) {
    const userId = req.user.id;

    const imageUrls = files?.map((file, index) => ({
      url: `/uploads/images/${file.filename}`,
      isPrimary: index === 0, // Mark first image as primary
    })) || [];

    return this.petPostsService.create(userId, createPetPostDto, imageUrls);
  }

  @Get()
  async findAll(@Query() filters: any) {
    return this.petPostsService.findAllActive(filters);
  }

  @Get(':id/adoption-requests')
  @UseGuards(JwtAuthGuard)
  async getAdoptionRequests(@Req() req: any, @Param('id') id: string) {
    return this.adoptionRequestsService.getRequestsForPost(req.user.id, id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.petPostsService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateStatusDto: UpdatePostStatusDto
  ) {
    return this.petPostsService.updateStatus(req.user.id, id, updateStatusDto.status);
  }
}
