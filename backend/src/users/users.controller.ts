import { Controller, Get, Patch, Post, Body, Req, UseGuards, Param, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

const storage = diskStorage({
  destination: './uploads/images',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
  },
});

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get('me')
    async getProfile(@Req() req: any) {
        return this.usersService.findById(req.user.id);
    }

    @Patch('me')
    @UseInterceptors(FileInterceptor('profileImage', { storage }))
    async updateProfile(@Req() req: any, @Body() body: any, @UploadedFile() file: Express.Multer.File) {
        const updateData: any = {
            fullName: body.fullName,
            contactPhone: body.contactPhone,
            city: body.city,
            district: body.district,
            biography: body.biography
        };

        if (file) {
            updateData.profileImageUrl = `/uploads/images/${file.filename}`;
        }

        return this.usersService.updateProfile(req.user.id, updateData);
    }

    @Get('me/saved-posts')
    async getSavedPosts(@Req() req: any) {
        return this.usersService.getSavedPosts(req.user.id);
    }

    @Post('me/saved-posts/:postId')
    async toggleSavedPost(@Req() req: any, @Param('postId') postId: string) {
        return this.usersService.toggleSavedPost(req.user.id, postId);
    }
}
