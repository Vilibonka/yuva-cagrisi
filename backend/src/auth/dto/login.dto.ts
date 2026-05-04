import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
    @IsEmail({}, { message: 'Lütfen geçerli bir e-posta adresi giriniz' })
    @IsNotEmpty({ message: 'E-posta boş bırakılamaz' })
    @MaxLength(255)
    email!: string;

    @IsString()
    @IsNotEmpty({ message: 'Şifre boş bırakılamaz' })
    @MaxLength(100)
    password!: string;
}
