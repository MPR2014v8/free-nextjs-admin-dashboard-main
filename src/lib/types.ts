// lib/types.ts
export type ID = string;

export type Role = 'admin' | 'staff' | 'student';

export type User = {
  id: ID;
  fullName: string;
  studentId: string;      // 11 หลัก
  email: string;
  major: string;
  faculty: string;
  year: number;
  groups: ID[];
  active: boolean;
  role: Role;             // NEW
  password?: string;      // NEW (demo only)
  createdAt: string;
};

export type Group = {
  id: ID;
  name: string;
  description?: string;
  tokenLimit: number;
  members: ID[];
  createdAt: string;
  updatedAt: string;
};

export type Ban = {
  id: ID;
  userId: ID;
  groupId?: ID;
  reason?: string;
  startAt: string;
  endAt?: string;
  createdBy: ID;
};
