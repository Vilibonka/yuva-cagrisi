import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, Matches, MaxLength } from 'class-validator';

export class RegisterDto {
    @IsString()
    @IsNotEmpty({ message: 'Ad Soyad boş bırakılamaz' })
    @Matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/, { message: 'Ad Soyad sadece harflerden oluşmalıdır ve emoji/özel karakter içeremez' })
    @MaxLength(100)
    fullName!: string;

    @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz' })
    @IsNotEmpty({ message: 'E-posta boş bırakılamaz' })
    @MaxLength(255)
    email!: string;

    @IsString()
    @IsNotEmpty({ message: 'Şifre boş bırakılamaz' })
    @MinLength(6, { message: 'Şifre en az 6 karakter olmalıdır' })
    @MaxLength(100)
    password!: string;

    @IsString()
    @IsOptional()
    @Matches(/^[0-9\s\-\+\(\)]*$/, { message: 'Geçerli bir telefon numarası giriniz' })
    @MaxLength(20)
    contactPhone?: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    city?: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    district?: string;

    @IsString()
    @IsOptional()
    @MaxLength(1000)
    biography?: string;

    @IsString()
    @IsOptional()
    profileImageUrl?: string;
}
