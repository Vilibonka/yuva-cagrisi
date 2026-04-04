import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private usersService: UsersService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'super-secret-key-for-auth',
        });
    }

    async validate(payload: any) {
        const user = await this.usersService.findByEmail(payload.email);
        if (!user) {
            throw new UnauthorizedException();
        }
        // returning user strips sensitive logic handled in auth service or allows req.user population
        return user;
    }
}
