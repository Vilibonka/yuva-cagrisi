import { Module } from '@nestjs/common';
import { AdoptionRequestsController } from './adoption-requests.controller';
import { AdoptionRequestsService } from './adoption-requests.service';

@Module({
  controllers: [AdoptionRequestsController],
  providers: [AdoptionRequestsService],
  exports: [AdoptionRequestsService],
})
export class AdoptionRequestsModule {}
