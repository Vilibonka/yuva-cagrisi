import { Controller, Get, Patch, Post, Body, Req, UseGuards, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get('me')
    async getProfile(@Req() req: any) {
        return this.usersService.findById(req.user.sub);
    }

    @Patch('me')
    async updateProfile(@Req() req: any, @Body() body: any) {
        return this.usersService.updateProfile(req.user.sub, {
            fullName: body.fullName,
            phone: body.phone,
            city: body.city,
            district: body.district,
            bio: body.bio
        });
    }

    @Get('me/saved-posts')
    async getSavedPosts(@Req() req: any) {
        return this.usersService.getSavedPosts(req.user.sub);
    }

    @Post('me/saved-posts/:postId')
    async toggleSavedPost(@Req() req: any, @Param('postId') postId: string) {
        return this.usersService.toggleSavedPost(req.user.sub, postId);
    }
}
