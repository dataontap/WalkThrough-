import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const walkthroughs = pgTable("walkthroughs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  targetApp: text("target_app").notNull(),
  targetUrl: text("target_url").notNull(),
  userType: text("user_type").notNull(),
  environment: text("environment").notNull(),
  status: text("status").notNull().default("draft"), // draft, recording, completed, failed
  videoUrl: text("video_url"),
  scriptContent: text("script_content"),
  duration: integer("duration"), // in seconds
  emailSent: boolean("email_sent").default(false),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// New table for recording requests via API
export const recordingRequests = pgTable("recording_requests", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  password: text("password").notNull(), // encrypted
  userPrompt: text("user_prompt").notNull(),
  targetUrl: text("target_url").notNull(),
  email: text("email").notNull(),
  status: text("status").notNull().default("pending"), // pending, recording, processing, completed, failed
  walkthroughId: integer("walkthrough_id").references(() => walkthroughs.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const walkthroughSteps = pgTable("walkthrough_steps", {
  id: serial("id").primaryKey(),
  walkthroughId: integer("walkthrough_id").references(() => walkthroughs.id),
  stepNumber: integer("step_number").notNull(),
  actionType: text("action_type").notNull(), // click, type, wait, navigate, tooltip
  targetElement: text("target_element"),
  instructions: text("instructions").notNull(),
  data: jsonb("data"), // Additional step data like text to type, wait duration, etc.
});

export const userCredentials = pgTable("user_credentials", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  application: text("application").notNull(),
  credentialType: text("credential_type").notNull(), // admin, standard, guest, power
  environment: text("environment").notNull(),
  encryptedCredentials: text("encrypted_credentials").notNull(), // JSON string of credentials
  createdAt: timestamp("created_at").defaultNow(),
});

// New table for mood/satisfaction ratings
export const walkthroughRatings = pgTable("walkthrough_ratings", {
  id: serial("id").primaryKey(),
  walkthroughId: integer("walkthrough_id").references(() => walkthroughs.id),
  userId: integer("user_id").references(() => users.id),
  difficulty: text("difficulty").notNull(), // very-easy, easy, medium, hard, very-hard
  satisfaction: text("satisfaction").notNull(), // very-unhappy, unhappy, neutral, happy, very-happy
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertWalkthroughSchema = createInsertSchema(walkthroughs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRecordingRequestSchema = createInsertSchema(recordingRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWalkthroughStepSchema = createInsertSchema(walkthroughSteps).omit({
  id: true,
});

export const insertUserCredentialSchema = createInsertSchema(userCredentials).omit({
  id: true,
  createdAt: true,
});

export const insertWalkthroughRatingSchema = createInsertSchema(walkthroughRatings).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Walkthrough = typeof walkthroughs.$inferSelect;
export type InsertWalkthrough = z.infer<typeof insertWalkthroughSchema>;

export type RecordingRequest = typeof recordingRequests.$inferSelect;
export type InsertRecordingRequest = z.infer<typeof insertRecordingRequestSchema>;

export type WalkthroughStep = typeof walkthroughSteps.$inferSelect;
export type InsertWalkthroughStep = z.infer<typeof insertWalkthroughStepSchema>;

export type UserCredential = typeof userCredentials.$inferSelect;
export type InsertUserCredential = z.infer<typeof insertUserCredentialSchema>;

export type WalkthroughRating = typeof walkthroughRatings.$inferSelect;
export type InsertWalkthroughRating = z.infer<typeof insertWalkthroughRatingSchema>;

// Extended types for API responses
export type WalkthroughWithSteps = Walkthrough & {
  steps: WalkthroughStep[];
  createdByUser?: Pick<User, 'id' | 'username'>;
  ratings?: WalkthroughRating[];
  avgDifficulty?: number;
  avgSatisfaction?: number;
};

export type DashboardStats = {
  totalWalkthroughs: number;
  activeUsers: number;
  completionRate: string;
  avgDuration: string;
};
