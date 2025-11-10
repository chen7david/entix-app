import type { HttpService } from "./http.service";

// Define the shape of your user data
export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
  password?: string;
}

export class UserService {
  private http: HttpService;

  constructor(http: HttpService) {
    this.http = http;
  }

  // Fetch all users
  async getAllUsers(): Promise<User[]> {
    return this.http.get<User[]>("/users");
  }

  // Fetch a single user by ID
  async getUserById(id: number): Promise<User> {
    return this.http.get<User>(`/users/${id}`);
  }

  // Create a new user
  async createUser(data: CreateUserDTO): Promise<User> {
    return this.http.post<User>("/users", data);
  }

  // Update an existing user
  async updateUser(id: number, data: UpdateUserDTO): Promise<User> {
    return this.http.put<User>(`/users/${id}`, data);
  }

  // Delete a user
  async deleteUser(id: number): Promise<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`/users/${id}`);
  }

  // Example of a domain-specific method
  async login(email: string, password: string): Promise<{ token: string }> {
    return this.http.post<{ token: string }>("/auth/login", {
      email,
      password,
    });
  }

  async getProfile(): Promise<User> {
    return this.http.get<User>("/auth/me");
  }
}
