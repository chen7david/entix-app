import { Injectable } from '@utils/typedi.util';
import { UserRoleRepository } from './user_role.repository';
import { CreateUserRoleParams } from '@modules/users/user.model';
import { DeleteUserRoleParams } from './user_role.model';
import { SuccessResult } from '@repo/entix-sdk';

@Injectable()
export class UserRoleService {
  constructor(private readonly userRoleRepository: UserRoleRepository) {}

  async createUserRole(params: CreateUserRoleParams): Promise<SuccessResult> {
    const success = await this.userRoleRepository.createUserRole(params);
    return { success };
  }

  async deleteUserRole(params: DeleteUserRoleParams): Promise<SuccessResult> {
    const success = await this.userRoleRepository.deleteUserRole(params);
    return { success };
  }
}
