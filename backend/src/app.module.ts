import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { AppController } from "./app.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { PetPostsModule } from "./pet-posts/pet-posts.module";
import { CommunicationModule } from "./communication/communication.module";
import { ReportsModule } from "./reports/reports.module";
import { AdminModule } from "./admin/admin.module";
import { AdoptionRequestsModule } from "./adoption-requests/adoption-requests.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { UserBlocksModule } from "./user-blocks/user-blocks.module";
import { CitiesModule } from './cities/cities.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000, // 60 seconds
      limit: 100, // max 100 requests per IP within the TTL
    }]),
    PrismaModule, 
    UsersModule, 
    AuthModule,
    PetPostsModule,
    AdoptionRequestsModule,
    CommunicationModule,
    ReportsModule,
    AdminModule,
    NotificationsModule,
    UserBlocksModule,
    CitiesModule,

  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
