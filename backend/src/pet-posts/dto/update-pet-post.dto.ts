import { PartialType } from '@nestjs/mapped-types';
import { CreatePetPostDto } from './create-pet-post.dto';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdatePetPostDto extends PartialType(CreatePetPostDto) {
  @IsString()
  @IsOptional()
  keptImages?: string;
}
