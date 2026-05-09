import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
    @IsString()
    @IsNotEmpty({ message: 'Token eksik.' })
    token!: string;

    @IsString()
    @MinLength(6, { message: 'Şifre en az 6 karakter olmalıdır.' })
    @IsNotEmpty({ message: 'Yeni şifre boş bırakılamaz.' })
    newPassword!: string;
}
