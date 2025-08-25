/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { v4 as uuid } from "uuid";
import type { User, Group, Ban, ID, Role } from "./types";
import { initialUsers, initialGroups, initialBans } from "./mockData";

/** ---- Simple localStorage persistence ---- */
const LS_KEY = "prism_admin_db_v1";

type DBState = {
  users: User[];
  groups: Group[];
  bans: Ban[];

  // users
  createUser: (v: Omit<User, "id" | "groups" | "createdAt" | "active" | "role"> & {
    active?: boolean;
    role?: Role;
    password?: string;
  }) => void;
  deleteUsersMany: (ids: ID[]) => void;
  setUsersActiveMany: (ids: ID[], active: boolean) => void;
  toggleUserActive: (id: ID) => void;

  // groups
  createGroup: (v: { name: string; description?: string; tokenLimit?: number }) => void;
  deleteGroup: (id: ID) => void;
  deleteGroupsMany: (ids: ID[]) => void;
  setGroupTokenLimit: (id: ID, limit: number) => void;
  addUserToGroup: (userId: ID, groupId: ID) => void;
  removeUserFromGroup: (userId: ID, groupId: ID) => void;

  // bans
  banMany: (userIds: ID[], payload: { groupId?: ID; reason?: string; endAt?: string }) => void;
  unban: (banId: ID) => void;
  unbanMany: (banIds: ID[]) => void;

  // helpers
  getAllEmailDomains: () => string[];

  // auth helpers (demo)
  findUserByEmail: (email: string) => User | undefined;
  verifyUserPassword: (user: User, password: string) => boolean;
  getUserById: (id: ID) => User | undefined;
  toPublicUser: (u: User) => { id: ID; fullName: string; email: string; role: Role; studentId: string };
};

function load(): Pick<DBState, "users" | "groups" | "bans"> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) throw new Error("no db");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.users) && Array.isArray(parsed?.groups) && Array.isArray(parsed?.bans)) {
      return parsed;
    }
  } catch {}
  return { users: initialUsers, groups: initialGroups, bans: initialBans };
}

function persist(state: Pick<DBState, "users" | "groups" | "bans">) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {}
}

export const useDB = create<DBState>((set, get) => {
  const seeded = typeof window !== "undefined" ? load() : { users: initialUsers, groups: initialGroups, bans: initialBans };

  const api: DBState = {
    ...seeded,

    /* ---------- Users ---------- */
    createUser: (v) => {
      const state = get();
      const user: User = {
        id: uuid(),
        fullName: v.fullName,
        studentId: v.studentId,
        email: v.email,
        major: v.major,
        faculty: v.faculty,
        year: v.year,
        groups: [],
        active: v.active ?? true,
        role: v.role ?? 'student',         
        password: v.password ?? 'student123',
        createdAt: new Date().toISOString(),
      };

      // auto add to faculty + major groups if exist
      const gByName = new Map(state.groups.map((g) => [g.name, g]));
      const gf = gByName.get(user.faculty);
      const gm = gByName.get(user.major);
      if (gf) { gf.members.push(user.id); user.groups.push(gf.id); }
      if (gm) { gm.members.push(user.id); user.groups.push(gm.id); }

      const next = { ...state, users: [user, ...state.users], groups: [...state.groups] };
      persist({ users: next.users, groups: next.groups, bans: next.bans });
      set(next);
    },

    deleteUsersMany: (ids) => {
      const state = get();
      const idset = new Set(ids);
      const users = state.users.filter((u) => !idset.has(u.id));
      // remove from groups
      const groups = state.groups.map((g) => ({ ...g, members: g.members.filter((m) => !idset.has(m)) }));
      // remove bans of those users
      const bans = state.bans.filter((b) => !idset.has(b.userId));

      const next = { users, groups, bans };
      persist(next);
      set(next as any);
    },

    setUsersActiveMany: (ids, active) => {
      const state = get();
      const idset = new Set(ids);
      const users = state.users.map((u) => (idset.has(u.id) ? { ...u, active } : u));
      const next = { ...state, users };
      persist({ users, groups: state.groups, bans: state.bans });
      set(next);
    },

    toggleUserActive: (id) => {
      const state = get();
      const users = state.users.map((u) => (u.id === id ? { ...u, active: !u.active } : u));
      const next = { ...state, users };
      persist({ users, groups: state.groups, bans: state.bans });
      set(next);
    },

    /* ---------- Groups ---------- */
    createGroup: (v) => {
      const state = get();
      const g: Group = {
        id: uuid(),
        name: v.name,
        description: v.description,
        tokenLimit: v.tokenLimit ?? 1000,
        members: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const next = { ...state, groups: [g, ...state.groups] };
      persist({ users: next.users, groups: next.groups, bans: next.bans });
      set(next);
    },

    deleteGroup: (id) => {
      const state = get();
      const groups = state.groups.filter((g) => g.id !== id);
      // remove id from users.groups
      const users = state.users.map((u) => ({ ...u, groups: u.groups.filter((gid) => gid !== id) }));
      const next = { ...state, groups, users };
      persist({ users, groups, bans: state.bans });
      set(next);
    },

    deleteGroupsMany: (ids) => {
      const state = get();
      const idset = new Set(ids);
      const groups = state.groups.filter((g) => !idset.has(g.id));
      const users = state.users.map((u) => ({ ...u, groups: u.groups.filter((gid) => !idset.has(gid)) }));
      const next = { ...state, groups, users };
      persist({ users, groups, bans: state.bans });
      set(next);
    },

    setGroupTokenLimit: (id, limit) => {
      const state = get();
      const groups = state.groups.map((g) => (g.id === id ? { ...g, tokenLimit: limit, updatedAt: new Date().toISOString() } : g));
      const next = { ...state, groups };
      persist({ users: state.users, groups, bans: state.bans });
      set(next);
    },

    addUserToGroup: (userId, groupId) => {
      const state = get();
      const groups = state.groups.map((g) =>
        g.id === groupId && !g.members.includes(userId) ? { ...g, members: [...g.members, userId], updatedAt: new Date().toISOString() } : g,
      );
      const users = state.users.map((u) => (u.id === userId && !u.groups.includes(groupId) ? { ...u, groups: [...u.groups, groupId] } : u));
      const next = { ...state, users, groups };
      persist({ users, groups, bans: state.bans });
      set(next);
    },

    removeUserFromGroup: (userId, groupId) => {
      const state = get();
      const groups = state.groups.map((g) => (g.id === groupId ? { ...g, members: g.members.filter((m) => m !== userId), updatedAt: new Date().toISOString() } : g));
      const users = state.users.map((u) => (u.id === userId ? { ...u, groups: u.groups.filter((gid) => gid !== groupId) } : u));
      const next = { ...state, users, groups };
      persist({ users, groups, bans: state.bans });
      set(next);
    },

    /* ---------- Bans ---------- */
    banMany: (userIds, payload) => {
      const state = get();
      const start = new Date().toISOString();
      const maker = state.users[0]?.id ?? "SYSTEM";
      const newBans: Ban[] = userIds.map((uid) => ({
        id: uuid(),
        userId: uid,
        groupId: payload.groupId,
        reason: payload.reason,
        startAt: start,
        endAt: payload.endAt,
        createdBy: maker,
      }));
      const bans = [...newBans, ...state.bans];
      const next = { ...state, bans };
      persist({ users: state.users, groups: state.groups, bans });
      set(next);
    },

    unban: (banId) => {
      const state = get();
      const bans = state.bans.filter((b) => b.id !== banId);
      const next = { ...state, bans };
      persist({ users: state.users, groups: state.groups, bans });
      set(next);
    },

    unbanMany: (banIds) => {
      const state = get();
      const idset = new Set(banIds);
      const bans = state.bans.filter((b) => !idset.has(b.id));
      const next = { ...state, bans };
      persist({ users: state.users, groups: state.groups, bans });
      set(next);
    },

    /* ---------- Helpers ---------- */
    getAllEmailDomains: () => {
      const setd = new Set<string>();
      for (const u of get().users) {
        const m = u.email.match(/@[\w.]+$/i);
        if (m) setd.add(m[0].toLowerCase());
      }
      return Array.from(setd).sort();
    },

    /* ---------- Auth Helpers (demo) ---------- */
    findUserByEmail: (email) => {
      return get().users.find(u => u.email.toLowerCase() === email.toLowerCase());
    },
    verifyUserPassword: (user, password) => {
      return (user.password ?? '') === password;
    },
    getUserById: (id) => get().users.find(u => u.id === id),
    toPublicUser: (u) => ({ id: u.id, fullName: u.fullName, email: u.email, role: u.role, studentId: u.studentId }),
  };

  if (typeof window !== "undefined") {
    persist({ users: api.users, groups: api.groups, bans: api.bans });
  }

  return api;
});
