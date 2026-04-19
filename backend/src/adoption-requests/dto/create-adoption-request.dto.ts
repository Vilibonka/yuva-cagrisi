import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAdoptionRequestDto {
  @IsUUID()
  postId!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsString()
  @IsOptional()
  housingType?: string;

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
