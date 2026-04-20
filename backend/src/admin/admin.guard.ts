import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const userRole = request.user?.role;

    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Admin access only');
    }
    return true;
  }
}
