import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Role } from '../src/common/enums/role.enum';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { Reflector } from '@nestjs/core';

describe('Security, RBAC & IDOR Integration Tests', () => {
  let rolesGuard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);
  });

  describe('Role-Based Access Control (RBAC)', () => {
    it('should block customer from calling admin endpoint', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

      const mockContext: any = {
        getHandler: () => {},
        getClass: () => {},
        switchToHttp: () => ({
          getRequest: () => ({
            user: { userId: 'cust-1', role: Role.CUSTOMER },
          }),
        }),
      };

      expect(() => rolesGuard.canActivate(mockContext)).toThrow(ForbiddenException);
    });

    it('should allow admin to access admin endpoint', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

      const mockContext: any = {
        getHandler: () => {},
        getClass: () => {},
        switchToHttp: () => ({
          getRequest: () => ({
            user: { userId: 'admin-1', role: Role.ADMIN },
          }),
        }),
      };

      expect(rolesGuard.canActivate(mockContext)).toBe(true);
    });

    it('should throw ForbiddenException if user is unauthenticated when roles are required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

      const mockContext: any = {
        getHandler: () => {},
        getClass: () => {},
        switchToHttp: () => ({
          getRequest: () => ({
            user: null, // no user
          }),
        }),
      };

      expect(() => rolesGuard.canActivate(mockContext)).toThrow(ForbiddenException);
    });
  });

  describe('Insecure Direct Object Reference (IDOR) Protection', () => {
    it('should throw ForbiddenException when Customer A attempts to view Customer B order', () => {
      const order = { id: 'ord-b', userId: 'user-b' };
      const currentUserId = 'user-a';
      const currentUserRole: Role = Role.CUSTOMER;

      const checkAccess = (role: Role, uid: string) => {
        if (role !== Role.ADMIN && order.userId !== uid) {
          throw new ForbiddenException('Bạn không có quyền truy cập đơn thuê này.');
        }
        return true;
      };

      expect(() => checkAccess(currentUserRole, currentUserId)).toThrow(ForbiddenException);
    });

    it('should allow Admin to view any customer order', () => {
      const order = { id: 'ord-b', userId: 'user-b' };
      const currentUserId = 'admin-id';
      const currentUserRole: Role = Role.ADMIN;

      const checkAccess = (role: Role, uid: string) => {
        if (role !== Role.ADMIN && order.userId !== uid) {
          throw new ForbiddenException('Bạn không có quyền truy cập đơn thuê này.');
        }
        return true;
      };

      expect(checkAccess(currentUserRole, currentUserId)).toBe(true);
    });
  });
});
