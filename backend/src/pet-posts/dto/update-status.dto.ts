import { IsEnum, IsNotEmpty } from 'class-validator';
import { PostStatus } from '@prisma/client';

export class UpdatePostStatusDto {
  @IsEnum(PostStatus)
  @IsNotEmpty()
  status!: PostStatus;
}
