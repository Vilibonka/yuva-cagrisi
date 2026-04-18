import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { PetPostsModule } from '../pet-posts/pet-posts.module';

@Module({
  imports: [PetPostsModule], // needed for petPostsService if accessed (even though we used raw prisma)
  providers: [ReportsService],
  controllers: [ReportsController],
  exports: [ReportsService],
})
export class ReportsModule {}
