import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private prisma: PrismaService,
    ) { }

    async register(registerDto: RegisterDto) {
        const existingUser = await this.usersService.findByEmail(registerDto.email);
        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(registerDto.password, salt);

        const { password, ...toSave } = registerDto;

        const user = await this.usersService.createUser({
            ...toSave,
            passwordHash: hashedPassword,
        });

        const tokens = await this.generateTokens(user.id, user.email, user.role);
        
        const { passwordHash, ...userResult } = user;
        return {
            user: userResult,
            ...tokens,
        };
    }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findByEmail(email);
        if (user && await bcrypt.compare(pass, user.passwordHash)) {
            const { passwordHash, ...result } = user;
            return result;
        }
        return null;
    }

    async login(loginDto: LoginDto) {
        const user = await this.validateUser(loginDto.email, loginDto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const tokens = await this.generateTokens(user.id, user.email, user.role);

        return {
            user,
            ...tokens,
        };
    }

    async refreshTokens(userId: string, refreshToken: string) {
        const user = await this.usersService.findById(userId);
        if (!user) throw new UnauthorizedException('Access Denied');

        const tokens = await this.prisma.refreshToken.findMany({
            where: { userId, revokedAt: null }
        });

        const validToken = tokens.find(t => bcrypt.compareSync(refreshToken, t.tokenHash));
        
        if (!validToken || validToken.expiresAt < new Date()) {
            throw new UnauthorizedException('Refresh token expired or invalid');
        }

        // Revoke current token
        await this.prisma.refreshToken.update({
            where: { id: validToken.id },
            data: { revokedAt: new Date() }
        });

        return this.generateTokens(user.id, user.email, user.role);
    }

    async generateTokens(userId: string, email: string, role: string) {
        const payload = { sub: userId, email, role };
        
        const accessToken = this.jwtService.sign(payload, {
            expiresIn: '1h',
        });

        const refreshToken = this.jwtService.sign(payload, {
            expiresIn: '7d',
        });

        const salt = await bcrypt.genSalt();
        const tokenHash = await bcrypt.hash(refreshToken, salt);

        await this.prisma.refreshToken.create({
            data: {
                userId,
                tokenHash,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            }
        });

        return {
            accessToken,
            access_token: accessToken,
            refreshToken,
        };
    }
}
