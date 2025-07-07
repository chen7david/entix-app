export type Permission = {
  id: string;
  name: string;
  permissionCode: number;
  description: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
