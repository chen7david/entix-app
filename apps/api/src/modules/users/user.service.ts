import { Injectable } from '@utils/typedi.util';
import { UserRepository } from '@modules/users/user.repository';
import {
  CreateUserParams,
  CreateUserResult,
  CreateUserRoleParams,
  CreateUserRoleResult,
  User,
} from '@modules/users/user.model';
import { UserRoleRepository } from '@modules/user_roles/user_role.repository';
import { DeleteUserRoleParams } from '@modules/user_roles/user_role.model';
import { Role } from '@repo/entix-sdk';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userRoleRepository: UserRoleRepository,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async findById(id: string): Promise<User | undefined> {
    return this.userRepository.findById(id);
  }

  async findByCognitoSub(sub: string): Promise<User | undefined> {
    return this.userRepository.findByCognitoSub(sub);
  }

  async createUser(params: CreateUserParams): Promise<CreateUserResult> {
    return this.userRepository.createUser(params);
  }

  async createUserRole(params: CreateUserRoleParams): Promise<CreateUserRoleResult> {
    return this.userRoleRepository.createUserRole(params);
  }

  async deleteUserRole(params: DeleteUserRoleParams): Promise<boolean> {
    return this.userRoleRepository.deleteUserRole(params);
  }

  async findUserRoles(id: string): Promise<Role[]> {
    return this.userRoleRepository.findUserRoles(id);
  }
}
