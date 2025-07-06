import { Injectable } from '@utils/typedi.util';
import { UserRepository } from '@modules/users/user.repository';
import {
  CreateUserParams,
  CreateUserResult,
  FindAllUsersResult,
  FindUserByIdResult,
  FindUserPermissionsResult,
  FindUserRolesResult,
} from '@modules/users/user.model';
import { UserRoleRepository } from '@modules/user_roles/user_role.repository';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userRoleRepository: UserRoleRepository,
  ) {}

  async findAll(): Promise<FindAllUsersResult> {
    return this.userRepository.findAll();
  }

  async findById(id: string): Promise<FindUserByIdResult> {
    return this.userRepository.findById(id);
  }

  async findByCognitoSub(sub: string): Promise<FindUserByIdResult> {
    return this.userRepository.findByCognitoSub(sub);
  }

  async createUser(params: CreateUserParams): Promise<CreateUserResult> {
    return this.userRepository.createUser(params);
  }

  async findUserRoles(userId: string): Promise<FindUserRolesResult> {
    return this.userRoleRepository.findUserRoles(userId);
  }

  async findUserPermissions(userId: string): Promise<FindUserPermissionsResult> {
    return this.userRepository.findUserPermissions(userId);
  }
}
