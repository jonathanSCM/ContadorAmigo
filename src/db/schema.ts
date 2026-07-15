// Esquema de la base de datos (SQLite / libSQL, vía drizzle-orm).
import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  createdAt: text("created_at").notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(), // token de sesión (opaco, aleatorio)
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at").notNull(), // epoch ms
});

export const businesses = sqliteTable("businesses", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sector: text("sector"), // ver src/lib/sectors.ts (Sector)
  nit: text("nit"),
  cardColor: text("card_color").notNull().default("#B85042"),
  savingsLabel: text("savings_label").notNull().default("Meta de ahorro"),
  savingsTarget: real("savings_target").notNull().default(0),
  emergencyMonths: integer("emergency_months").notNull().default(3),
  createdAt: text("created_at").notNull(),
});

export const movements = sqliteTable("movements", {
  id: text("id").primaryKey(),
  businessId: text("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "ingreso" | "gasto"
  concept: text("concept").notNull(),
  amountNet: real("amount_net").notNull(),
  hasInvoice: integer("has_invoice", { mode: "boolean" }).notNull(),
  category: text("category").notNull(),
  date: text("date").notNull(), // ISO
  note: text("note"),
  providerName: text("provider_name"),
  invoiceNumber: text("invoice_number"),
  providerNit: text("provider_nit"),
});

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  businessId: text("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  cost: real("cost").notNull(),
  price: real("price").notNull(),
});
