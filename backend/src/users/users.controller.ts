import { Controller, Get, Patch, Post, Body, Req, UseGuards, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get('me')
    async getProfile(@Req() req: any) {
        return this.usersService.findById(req.user.id);
    }

    @Patch('me')
    async updateProfile(@Req() req: any, @Body() body: any) {
        return this.usersService.updateProfile(req.user.id, {
            fullName: body.fullName,
            contactPhone: body.contactPhone,
            city: body.city,
            district: body.district,
            biography: body.biography
        });
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
