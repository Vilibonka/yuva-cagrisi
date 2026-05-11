import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private prisma: PrismaService,
        private mailService: MailService,
    ) { }

    async register(registerDto: RegisterDto) {
        const existingUser = await this.usersService.findByEmail(registerDto.email);
        if (existingUser) {
            throw new ConflictException('Bu e-posta adresi zaten kullanımda');
        }

        if (registerDto.contactPhone) {
            const existingPhone = await this.usersService.findByPhone(registerDto.contactPhone);
            if (existingPhone) {
                throw new ConflictException('Bu telefon numarası zaten kullanımda');
            }
        }

        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(registerDto.password, salt);

        const { password, ...toSave } = registerDto;
        
        let cityId = undefined;
        if (toSave.city) {
            const cityRecord = await this.prisma.city.findFirst({
                where: { name: { equals: toSave.city, mode: 'insensitive' } }
            });
            if (cityRecord) {
                cityId = cityRecord.id;
            }
        }

        const createData: any = {
            ...toSave,
            passwordHash: hashedPassword,
        };
        delete createData.city;
        if (cityId) {
            createData.cityId = cityId;
        }

        const user = await this.usersService.createUser(createData);

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

    async forgotPassword(email: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            // We shouldn't reveal if a user exists or not for security reasons, so we return success either way.
            return { message: 'If your email is registered, a password reset link has been sent.' };
        }

        // Invalidate old tokens for this user
        await this.prisma.passwordResetToken.deleteMany({
            where: { userId: user.id }
        });

        // Generate a cryptographically secure random token
        const resetToken = crypto.randomBytes(32).toString('hex');
        
        // Hash it before saving to DB
        const salt = await bcrypt.genSalt();
        const hashedToken = await bcrypt.hash(resetToken, salt);

        await this.prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                token: hashedToken,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60) // 1 hour
            }
        });

        // Send email with the unhashed token
        const previewUrl = await this.mailService.sendPasswordResetEmail(user.email, resetToken);

        return { 
            message: 'If your email is registered, a password reset link has been sent.',
            previewUrl
        };
    }

    async resetPassword(token: string, newPassword: string) {
        // Find all valid tokens (not expired)
        const activeTokens = await this.prisma.passwordResetToken.findMany({
            where: { expiresAt: { gt: new Date() } }
        });

        // Find the matching token
        let matchedToken = null;
        for (const record of activeTokens) {
            if (await bcrypt.compare(token, record.token)) {
                matchedToken = record;
                break;
            }
        }

        if (!matchedToken) {
            throw new UnauthorizedException('Invalid or expired password reset token.');
        }

        const user = await this.usersService.findById(matchedToken.userId);
        if (!user) {
            throw new UnauthorizedException('User not found.');
        }

        // Hash new password
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update user
        await this.prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: hashedPassword }
        });

        // Delete the used token
        await this.prisma.passwordResetToken.deleteMany({
            where: { userId: user.id }
        });

        // Optional: Revoke all existing refresh tokens so user has to log in again everywhere
        await this.prisma.refreshToken.updateMany({
            where: { userId: user.id, revokedAt: null },
            data: { revokedAt: new Date() }
        });

        return { message: 'Password has been successfully reset.' };
    }
}
