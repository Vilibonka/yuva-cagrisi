import { Module } from "@nestjs/common";
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

@Module({
  imports: [
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

  ],
  controllers: [AppController],
})
export class AppModule { }
