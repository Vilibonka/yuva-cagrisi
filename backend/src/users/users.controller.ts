import { Controller, Get, Patch, Post, Body, Req, UseGuards, Param, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

const storage = diskStorage({
    destination: './uploads/avatars',
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `avatar-${uniqueSuffix}${extname(file.originalname)}`);
    },
});

import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('me')
    async getProfile(@Req() req: any) {
        return this.usersService.findById(req.user.id);
    }

    @Patch('me')
    async updateProfile(@Req() req: any, @Body() body: UpdateUserDto) {
        return this.usersService.updateProfile(req.user.id, {
            fullName: body.fullName,
            contactPhone: body.contactPhone,
            city: body.city,
            district: body.district,
            biography: body.biography,
            profileImageUrl: body.profileImageUrl,
            showReadReceipts: body.showReadReceipts,
            showLastSeen: body.showLastSeen
        });
    }

    @Patch('me/avatar')
    @UseInterceptors(FileInterceptor('avatar', { storage }))
    async updateAvatar(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
        const avatarUrl = `/uploads/avatars/${file.filename}`;
        return this.usersService.updateProfile(req.user.id, { profileImageUrl: avatarUrl });
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
