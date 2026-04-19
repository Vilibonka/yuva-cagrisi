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
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";

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
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    })
  ],
  controllers: [AppController],
})
export class AppModule { }
