import { useEffect, useState } from "react";
import { Factory } from "../factories/factory";
import type { User } from "../services/user.service";

export const HomePage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const userService = Factory.createUserService();

  useEffect(() => {
    // Fetch users
    userService
      .getAllUsers()
      .then((users) => setUsers(users))
      .catch((err) => console.error("Failed to load users:", err));
  }, []);

  return (
    <div>
      <h1 className="text-xl">Welcome to the Home Page</h1>
      <p>This is the main landing page of the application.</p>
      <p>Total users: {JSON.stringify(users)}</p>
    </div>
  );
};
