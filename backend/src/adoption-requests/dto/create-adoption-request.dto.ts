import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { HousingType } from '@prisma/client';

export class CreateAdoptionRequestDto {
  @IsUUID()
  postId!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsEnum(HousingType)
  @IsOptional()
  housingType?: HousingType;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  hasOtherPets?: boolean;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  hasChildren?: boolean;

  @IsString()
  @IsOptional()
  experienceWithPets?: string;

  @IsString()
  @IsOptional()
  whyAdopt?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;
}
