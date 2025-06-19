export type User = {
  id: string;
  sub: string;
  email: string;
  username: string;
  disabledAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
