import { Injectable } from '@utils/typedi.util';
import { UserRepository } from '@modules/users/user.repository';
import { CreateUserParams, CreateUserResult, User } from '@modules/users/user.model';
import { UserRoleRepository } from '@modules/user_roles/user_role.repository';
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

  async findUserRoles(id: string): Promise<Role[]> {
    return this.userRoleRepository.findUserRoles(id);
  }
}
