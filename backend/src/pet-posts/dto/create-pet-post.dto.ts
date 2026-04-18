import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { Species, Gender, AnimalSize, PostType } from '@prisma/client';

export class CreatePetPostDto {
  // Pet info
  @IsEnum(Species)
  @IsNotEmpty()
  species!: Species;

  @IsString()
  @IsOptional()
  breed?: string;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  estimatedAgeMonths?: number;

  @IsEnum(AnimalSize)
  @IsOptional()
  size?: AnimalSize;

  @IsString()
  @IsOptional()
  healthSummary?: string;

  @IsString()
  @IsOptional()
  temperament?: string;

  // Post info
  @IsEnum(PostType)
  @IsNotEmpty()
  postType!: PostType;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;
}
