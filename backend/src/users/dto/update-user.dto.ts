import { IsEmail, IsOptional, IsString, MaxLength, Matches, IsBoolean } from 'class-validator';

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    @Matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/, { message: 'Ad Soyad sadece harflerden oluşmalıdır ve emoji/özel karakter içeremez' })
    @MaxLength(100)
    fullName?: string;

    @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz' })
    @IsOptional()
    @MaxLength(255)
    email?: string;

    @IsString()
    @IsOptional()
    @Matches(/^05\d{9}$/, { message: 'Telefon numarası 05 ile başlamalı ve 11 haneli olmalıdır (Örn: 05XXXXXXXXX)' })
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

    @IsBoolean()
    @IsOptional()
    showReadReceipts?: boolean;

    @IsBoolean()
    @IsOptional()
    showLastSeen?: boolean;
}
