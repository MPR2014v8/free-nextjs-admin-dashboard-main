/* eslint-disable @typescript-eslint/no-explicit-any */
import { v4 as uuid } from "uuid";
import type { User, Group, Ban } from "./types";

const now = () => new Date().toISOString();
const daysFromNow = (d: number) =>
  new Date(Date.now() + d * 86400_000).toISOString();

/** ---------------- Thai Names ---------------- */
const TH_FIRST_NAMES = [
  "กิตติ","สุชาติ","อภิสิทธิ์","ธนกฤต","ปวีณา","ชลธิชา","ณัฐวุฒิ","ศิริพร","วราภรณ์","ชัยวัฒน์",
  "อนันต์","รุ่งนภา","ภัทรพล","ณัฐชา","ปฐมพงษ์","ฐิติมา","พัชรี","สุนีย์","จิราพร","ธีระ",
  "วีรวุฒิ","ภูมิพัฒน์","พิชญา","พิมพ์ชนก","อรทัย","สุรีย์พร","นฤมล","กมล","อธิชาติ","ภคิน",
  "ธิดารัตน์","นพดล","ชนิกานต์","ภาวิณี","ธันวา","ภาณุพงศ์","สุธิดา","พีรพงศ์","วริษฐา","นิภาพร",
  "ปรเมษฐ์","วรพล","พิชิต","ณัฐนิชา","อริสรา","ธนวรรธน์","พรทิพย์","จิรายุ","รัชนีกร","ชลธร",
];
const TH_LAST_NAMES = [
  "ศรีวงศ์","ใจดี","แก้ววงศ์","ปัญญา","อินทร์แก้ว","ทองดี","สุวรรณ","วงศ์ไทย","ตั้งจิต","ศิริชัย",
  "อารยะ","จันทร์สว่าง","บุญช่วย","วัฒนกูล","สมบูรณ์","แก้วกาญจน์","วงศ์สุวรรณ","บวรศักดิ์","รัตนากร","จิตอารี",
  "สายชล","สถาพร","ชัยชนะ","พิพัฒน์","ธรรมสถิต","เกษมสุข","วรรณกิจ","อนันตกูล","กำเนิดศิลป์","คงคา",
  "สิงหนาท","เรืองเดช","คำดี","อินทรา","เวียงชัย","นิมิตดี","ยอดยิ่ง","อารีย์วงศ์","สงวนศักดิ์","รุ่งเรือง",
  "เพชรรัตน์","เพชรดี","จิตรโสภา","พิบูลย์","ผาสุข","อินทราวงศ์","พงศ์ไทย","ประชาเดช","ประเสริฐ","วรเดช",
];

/** ---------------- Faculties & Majors (English names) ---------------- */
export const FACULTIES = [
  "Science",
  "Engineering",
  "Business Administration",
  "Humanities and Social Sciences",
  "Education",
  "Medicine",
  "Nursing",
  "Public Health",
  "Information Technology",
  "Agriculture",
  "Fine Arts",
] as const;

export const MAJORS_BY_FACULTY: Record<(typeof FACULTIES)[number], string[]> = {
  Science: ["Computer Science", "Mathematics", "Chemistry", "Physics", "Biology"],
  Engineering: ["Computer Engineering", "Electrical Engineering", "Civil Engineering", "Mechanical Engineering"],
  "Business Administration": ["Accounting", "Marketing", "Finance", "Management"],
  "Humanities and Social Sciences": ["English Language", "Thai Language", "Public Administration", "Sociology"],
  Education: ["Teaching Thai", "Teaching English", "Computer Education"],
  Medicine: ["Medicine"],
  Nursing: ["Nursing"],
  "Public Health": ["Public Health", "Occupational Health and Safety"],
  "Information Technology": ["Information Technology", "Data Science", "Artificial Intelligence"],
  Agriculture: ["Agriculture", "Animal Science", "Fisheries"],
  "Fine Arts": ["Music", "Visual Arts", "Design"],
};

const DOMAINS = ["@udru.ac.th","@gmail.com","@hotmail.com","@outlook.com","@yahoo.com"];
const pick = <T,>(arr: T[], i: number) => arr[i % arr.length];

/** สร้างรหัสนักศึกษา 11 หลัก: 65 + คณะ(2) + สาขา(2) + running(5) */
function buildStudentId(i: number, facultyIdx: number, majorIdx: number) {
  const year = 65; // mock
  const fac = String(facultyIdx + 1).padStart(2, "0");
  const maj = String(majorIdx + 1).padStart(2, "0");
  const run = String(i + 1).padStart(5, "0");
  return `${year}${fac}${maj}${run}`;
}

/** ---------------- Generate Users (120) ---------------- */
function generateUsers(count = 120): User[] {
  const users: User[] = [];
  for (let i = 0; i < count; i++) {
    const facultyIdx = i % FACULTIES.length;
    const faculty = FACULTIES[facultyIdx];
    const majors = MAJORS_BY_FACULTY[faculty];
    const majorIdx = i % majors.length;
    const major = majors[majorIdx];

    const fullName = `${pick(TH_FIRST_NAMES, i)} ${pick(TH_LAST_NAMES, i)}`;
    const studentId = buildStudentId(i, facultyIdx, majorIdx);
    const domain = pick(DOMAINS, i);
    const year = ((i % 5) + 1);

    users.push({
      id: uuid(),
      fullName,
      studentId,
      email: `stu${studentId}${domain}`,
      major,
      faculty,
      year,
      groups: [],
      active: i % 7 !== 0,
      role: 'student',          // NEW
      password: 'student123',   // NEW (demo)
      createdAt: now(),
    });
  }

  // Admin (index 0)
  users[0].fullName = "ผู้ดูแลหลัก";
  users[0].email = "admin@udru.ac.th";
  users[0].major = "Computer Science";
  users[0].faculty = "Information Technology";
  users[0].year = 4;
  users[0].active = true;
  users[0].role = 'admin';       // NEW
  users[0].password = 'admin123';// NEW

  return users;
}

const seedUsers = generateUsers();

/** ---------------- Build Groups: Admin + each Faculty + each Major ---------------- */
const GROUP_ADMIN_ID = uuid();

function buildGroupsAndMemberships(u: User[]) {
  const facultyNames = [...new Set(u.map((x) => x.faculty))].sort();
  const majorNames = [...new Set(u.map((x) => x.major))].sort();

  const groups: Group[] = [
    {
      id: GROUP_ADMIN_ID,
      name: "Admin",
      description: "System administrators",
      tokenLimit: 5000,
      members: [],
      createdAt: now(),
      updatedAt: now(),
    },
    ...facultyNames.map<Group>((name) => ({
      id: uuid(),
      name,
      description: `Faculty group: ${name}`,
      tokenLimit: 1200,
      members: [],
      createdAt: now(),
      updatedAt: now(),
    })),
    ...majorNames.map<Group>((name) => ({
      id: uuid(),
      name,
      description: `Major group: ${name}`,
      tokenLimit: 1000,
      members: [],
      createdAt: now(),
      updatedAt: now(),
    })),
  ];

  const byName = new Map(groups.map((g) => [g.name, g]));
  const admin = groups.find((g) => g.id === GROUP_ADMIN_ID)!;

  [0, 1].forEach((i) => admin.members.push(u[i].id)); // 2 แอดมิน (user[1] จะยังเป็น student แต่ได้อยู่ในกลุ่ม Admin)

  for (const usr of u) {
    byName.get(usr.faculty)?.members.push(usr.id);
    byName.get(usr.major)?.members.push(usr.id);
  }

  // เติม users.groups
  const usersById = new Map(u.map((x) => [x.id, x]));
  for (const g of groups) {
    for (const uid of g.members) {
      const user = usersById.get(uid);
      if (user && !user.groups.includes(g.id)) user.groups.push(g.id);
    }
  }

  return { groups, users: u };
}

const { groups, users } = buildGroupsAndMemberships(seedUsers);

/** ---------------- Sample Bans ---------------- */
const bans: Ban[] = [
  {
    id: uuid(),
    userId: users[5].id,
    groupId: undefined,
    reason: "ทุจริตในการสอบ",
    startAt: now(),
    endAt: daysFromNow(7),
    createdBy: users[0].id,
  },
  {
    id: uuid(),
    userId: users[15].id,
    groupId: groups.find((g) => g.name === users[15].major)?.id,
    reason: "ใช้งานเกินโควต้า",
    startAt: now(),
    endAt: daysFromNow(1),
    createdBy: users[0].id,
  },
  {
    id: uuid(),
    userId: users[25].id,
    groupId: groups.find((g) => g.name === users[25].faculty)?.id,
    reason: "ระงับชั่วคราว",
    startAt: now(),
    endAt: undefined,
    createdBy: users[1].id,
  },
];

export const initialUsers: User[] = users;
export const initialGroups: Group[] = groups;
export const initialBans: Ban[] = bans;

export const GROUP_IDS = { ADMIN: GROUP_ADMIN_ID };
