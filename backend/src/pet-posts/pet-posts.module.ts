import { Module } from '@nestjs/common';
import { AdoptionRequestsModule } from '../adoption-requests/adoption-requests.module';
import { PetPostsService } from './pet-posts.service';
import { PetPostsController } from './pet-posts.controller';

@Module({
  imports: [AdoptionRequestsModule],
  controllers: [PetPostsController],
  providers: [PetPostsService],
  exports: [PetPostsService],
})
export class PetPostsModule {}
