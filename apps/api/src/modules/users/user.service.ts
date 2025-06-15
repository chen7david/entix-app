import { Injectable } from '@utils/typedi.util';
import { UserRepository } from '@modules/users/user.repository';
import { CreateUserParams, CreateUserResult, User } from '@modules/users/user.model';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async createUser(params: CreateUserParams): Promise<CreateUserResult> {
    return this.userRepository.createUser(params);
  }
}
