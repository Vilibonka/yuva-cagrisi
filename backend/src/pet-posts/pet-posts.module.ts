import { Module } from '@nestjs/common';
import { PetPostsService } from './pet-posts.service';
import { PetPostsController } from './pet-posts.controller';

@Module({
  controllers: [PetPostsController],
  providers: [PetPostsService],
  exports: [PetPostsService],
})
export class PetPostsModule {}
