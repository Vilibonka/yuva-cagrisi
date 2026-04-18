import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    // In a real app we'd get request.user from JwtAuthGuard.
    // For demo purposes, we will accept a special header or body role
    const userRole = request.user?.role || request.headers['x-user-role'] || 'USER';

    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Admin access only');
    }
    return true;
  }
}
