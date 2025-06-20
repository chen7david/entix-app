import { accessTokenPayloadSchema, refreshTokenPayloadSchema } from '@schemas/user-auth.schema';
import { z } from 'zod';

export type AccessTokenPayloadResult = z.infer<typeof accessTokenPayloadSchema>;

export type RefreshTokenPayloadResult = z.infer<typeof refreshTokenPayloadSchema>;

export enum PermissionCode {
  // User
  GET_USERS = 1,
  GET_USER = 2,
  GET_USER_ROLES = 3,

  // User Role
  CREATE_USER_ROLE = 4,
  DELETE_USER_ROLE = 5,

  // Role
  GET_ROLES = 6,
  CREATE_ROLE = 7,
  GET_ROLE = 8,
  UPDATE_ROLE = 9,
  DELETE_ROLE = 10,
  GET_ROLE_USERS = 11,
  GET_ROLE_PERMISSIONS = 12,

  // Role Permission
  CREATE_ROLE_PERMISSION = 13,
  DELETE_ROLE_PERMISSION = 14,

  // Permission
  GET_PERMISSIONS = 15,
  CREATE_PERMISSION = 16,
  GET_PERMISSION = 17,
  UPDATE_PERMISSION = 18,
  DELETE_PERMISSION = 19,
  GET_PERMISSION_ROLES = 20,
}
