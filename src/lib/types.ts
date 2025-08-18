export type ID = string;

export type User = {
  id: ID;
  fullName: string;
  studentId: string; // 11 digits
  email: string;
  major: string;
  faculty: string;
  year: number;
  groups: ID[]; // group ids
  active: boolean;
  createdAt: string;
};

export type Group = {
  id: ID;
  name: string;
  description?: string;
  tokenLimit: number;
  members: ID[]; // user ids
  createdAt: string;
  updatedAt: string;
};

export type Ban = {
  id: ID;
  userId: ID;
  groupId?: ID; // undefined = Global
  reason?: string; // ไทย
  startAt: string;
  endAt?: string;
  createdBy: ID;
};
