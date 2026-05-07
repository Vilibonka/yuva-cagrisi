import { Module } from "@nestjs/common";
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
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

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
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
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  controllers: [AppController],
})
export class AppModule { }
