import { Controller, Post, Get, Patch, Body, Param, Query, UseInterceptors, UploadedFiles, Req } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
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
  constructor(private readonly petPostsService: PetPostsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images', 5, { storage }))
  async create(
    @Req() req: any,
    @Body() createPetPostDto: CreatePetPostDto,
    @UploadedFiles() files: Array<Express.Multer.File>
  ) {
    // Mock user ID from a hypothetical auth guard. 
    // Usually retrieved from req.user.id after JwtAuthGuard
    // For this demonstration, we take userId from body if sent, or fallback to a dummy UUID or existing one.
    // Ensure you align this with your actual JWT strategy.
    const userId = req.user?.id || req.body.ownerUserId || "00000000-0000-0000-0000-000000000000";

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

  @Patch(':id/status')
  async updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateStatusDto: UpdatePostStatusDto
  ) {
    const userId = req.user?.id || req.body.ownerUserId || "00000000-0000-0000-0000-000000000000";
    return this.petPostsService.updateStatus(userId, id, updateStatusDto.status);
  }
}
