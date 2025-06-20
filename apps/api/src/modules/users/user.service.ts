import { Injectable } from '@utils/typedi.util';
import { UserRepository } from '@modules/users/user.repository';
import {
  CreateUserParams,
  CreateUserResult,
  FindAllUsersResult,
  FindUserByIdResult,
  FindUserRolesResult,
} from '@modules/users/user.model';
import { UserRoleRepository } from '@modules/user_roles/user_role.repository';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userRoleRepository: UserRoleRepository,
  ) {}

  /**
   * Retrieves all users from the database
   */
  async findAll(): Promise<FindAllUsersResult> {
    return this.userRepository.findAll();
  }

  /**
   * Finds a user by their ID
   * @param id - User ID
   */
  async findById(id: string): Promise<FindUserByIdResult> {
    return this.userRepository.findById(id);
  }

  /**
   * Finds a user by their Cognito sub identifier
   * @param sub - Cognito sub
   */
  async findByCognitoSub(sub: string): Promise<FindUserByIdResult> {
    return this.userRepository.findByCognitoSub(sub);
  }

  /**
   * Creates a new user
   * @param params - User creation parameters
   */
  async createUser(params: CreateUserParams): Promise<CreateUserResult> {
    return this.userRepository.createUser(params);
  }

  /**
   * Finds all roles assigned to a user
   * @param id - User ID
   */
  async findUserRoles(id: string): Promise<FindUserRolesResult> {
    return this.userRoleRepository.findUserRoles(id);
  }
}
