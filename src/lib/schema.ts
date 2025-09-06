import { sql, type InferSelectModel } from "drizzle-orm"
import {
    boolean,
    foreignKey,
    json,
    pgTable,
    primaryKey,
    text,
    timestamp,
    uuid,
    varchar,
    integer,
    pgEnum,
} from "drizzle-orm/pg-core"

export const policy = pgTable("Policy", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    name: varchar("name", { length: 250 }).notNull(),
    detail: text("detail"),
    tokenLimit: integer("token_limit").default(0).notNull(),
    fileLimit: integer("file_limit").default(1).notNull(),
    fileSizeLimit: integer("file_size").default(5).notNull(),
    share: boolean().default(false).notNull(),
});

export type Policy = InferSelectModel<typeof policy>;

export const prefixEnum = pgEnum('prefix_enum', [
    'นาย',
    'นาง',
    'นางสาว'
])

export const user = pgTable("User", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    email: varchar("email", { length: 64 }).notNull(),
    password: varchar("password", { length: 64 }),
    prefix: prefixEnum('prefix'),
    firstname: varchar("firstname", { length: 250 }),
    lastname: varchar("lastname", { length: 250 }),
    is_active: boolean("is_active").default(true),
    departmentId: uuid("department"),
    policyId: uuid("policyId").references(() => policy.id),
}, (table) => {
    return {
        userDerpartmentIdFk: foreignKey({
            columns: [table.departmentId],
            foreignColumns: [department.id],
            name: 'User_DepartmentId_Department_id_fk'
        })
    }
})

export type User = InferSelectModel<typeof user>

export const chat = pgTable("Chat", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull(),
    title: text("title").notNull(),
    userId: uuid("userId")
        .notNull()
        .references(() => user.id),
    visibility: varchar("visibility", { enum: ["public", "private"] })
        .notNull()
        .default("private"),
})

export type Chat = InferSelectModel<typeof chat>


export const message = pgTable("Message", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    chatId: uuid("chatId")
        .notNull()
        .references(() => chat.id),
    role: varchar("role").notNull(),
    parts: json("parts").notNull(),
    token: integer("token").notNull(),
    attachments: json("attachments").notNull(),
    createdAt: timestamp("createdAt").notNull(),
})

export type DBMessage = InferSelectModel<typeof message>

export const vote = pgTable(
    "Vote",
    {
        chatId: uuid("chatId")
            .notNull()
            .references(() => chat.id),
        messageId: uuid("messageId")
            .notNull()
            .references(() => message.id),
        isUpvoted: boolean("isUpvoted").notNull(),
    },
    (table) => {
        return {
            pk: primaryKey({ columns: [table.chatId, table.messageId] }),
        }
    },
)

export type Vote = InferSelectModel<typeof vote>

export const document = pgTable(
    "Document",
    {
        id: uuid("id").notNull().defaultRandom(),
        createdAt: timestamp("createdAt").notNull(),
        title: text("title").notNull(),
        content: text("content"),
        kind: varchar("text", { enum: ["text", "code", "image", "sheet"] })
            .notNull()
            .default("text"),
        userId: uuid("userId")
            .notNull()
            .references(() => user.id),
    },
    (table) => {
        return {
            pk: primaryKey({ columns: [table.id, table.createdAt] }),
        }
    },
)

export type Document = InferSelectModel<typeof document>

export const suggestion = pgTable(
    "Suggestion",
    {
        id: uuid("id").notNull().defaultRandom(),
        documentId: uuid("documentId").notNull(),
        documentCreatedAt: timestamp("documentCreatedAt").notNull(),
        originalText: text("originalText").notNull(),
        suggestedText: text("suggestedText").notNull(),
        description: text("description"),
        isResolved: boolean("isResolved").notNull().default(false),
        userId: uuid("userId")
            .notNull()
            .references(() => user.id),
        createdAt: timestamp("createdAt").notNull(),
    },
    (table) => ({
        pk: primaryKey({ columns: [table.id] }),
        documentRef: foreignKey({
            columns: [table.documentId, table.documentCreatedAt],
            foreignColumns: [document.id, document.createdAt],
        }),
    }),
)

export type Suggestion = InferSelectModel<typeof suggestion>

export const stream = pgTable(
    "Stream",
    {
        id: uuid("id").notNull().defaultRandom(),
        chatId: uuid("chatId").notNull(),
        createdAt: timestamp("createdAt").notNull(),
    },
    (table) => ({
        pk: primaryKey({ columns: [table.id] }),
        chatRef: foreignKey({
            columns: [table.chatId],
            foreignColumns: [chat.id],
        }),
    }),
)

export type Stream = InferSelectModel<typeof stream>

export const account = pgTable("Account", {
    userId: uuid().notNull(),
    type: text().notNull(),
    provider: text().notNull(),
    providerAccountId: text().notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: text("token_type"),
    scope: text(),
    idToken: text("id_token"),
    sessionState: text("session_state"),
    createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
},
    (table) => {
        return {
            accountUserIdFkey: foreignKey({
                columns: [table.userId],
                foreignColumns: [user.id],
                name: "Account_userId_fkey"
            }).onUpdate("cascade").onDelete("cascade"),
            accountPkey: primaryKey({ columns: [table.provider, table.providerAccountId], name: "Account_pkey" }),
        }
    });

export type Account = InferSelectModel<typeof account>

export const faculty = pgTable("Faculty", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 250 }).notNull(),
    detail: text("detail").notNull(),
})

export type Faculty = InferSelectModel<typeof faculty>

export const department = pgTable("Department", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 250 }).notNull(),
    detail: text("detail").notNull(),
    facultyId: uuid().notNull(),
}, (table) => {
    return {
        departmentFacultyIdFkey: foreignKey({
            columns: [table.facultyId],
            foreignColumns: [faculty.id],
            name: "Faculty_facultyId_fkey"
        }).onDelete("cascade")
    }
})

export type Department = InferSelectModel<typeof department>

// --- Ban (บันทึกการแบนผู้ใช้) ---
export const ban = pgTable(
    "Ban",
    {
        id: uuid("id").defaultRandom().primaryKey().notNull(),
        userId: uuid("user_id")
            .notNull()
            .references(() => user.id), // onDelete cascade ใช้ผ่าน FK ด้านล่าง
        groupId: uuid("group_id").references(() => policy.id), // null = Global scope
        reason: text("reason"),
        startAt: timestamp("start_at").defaultNow().notNull(),
        endAt: timestamp("end_at"),
    },
    (table) => ({
        banUserFk: foreignKey({
            columns: [table.userId],
            foreignColumns: [user.id],
            name: "Ban_userId_fkey",
        }).onDelete("cascade"),
        banPolicyFk: foreignKey({
            columns: [table.groupId],
            foreignColumns: [policy.id],
            name: "Ban_groupId_fkey",
        }).onDelete("set null"),
    }),
);

export type Ban = InferSelectModel<typeof ban>;

export const model = pgTable("Model", {
    id: uuid("id").primaryKey().defaultRandom(),
    modelId: varchar("modelId", { length: 250 }).notNull(),
    name: varchar("name", { length: 250 }).notNull(),
    description: text("description"),
    provider: varchar("provider", { length: 20 }).notNull()
})

export type Model = InferSelectModel<typeof model>