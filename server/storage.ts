import { 
  users, 
  walkthroughs, 
  walkthroughSteps, 
  userCredentials,
  recordingRequests,
  walkthroughRatings,
  type User, 
  type InsertUser,
  type Walkthrough,
  type InsertWalkthrough,
  type WalkthroughStep,
  type InsertWalkthroughStep,
  type UserCredential,
  type InsertUserCredential,
  type RecordingRequest,
  type InsertRecordingRequest,
  type WalkthroughRating,
  type InsertWalkthroughRating,
  type WalkthroughWithSteps,
  type DashboardStats
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Walkthroughs
  getWalkthrough(id: number): Promise<WalkthroughWithSteps | undefined>;
  getAllWalkthroughs(): Promise<WalkthroughWithSteps[]>;
  getWalkthroughsByUser(userId: number): Promise<WalkthroughWithSteps[]>;
  createWalkthrough(walkthrough: InsertWalkthrough): Promise<Walkthrough>;
  updateWalkthrough(id: number, walkthrough: Partial<InsertWalkthrough>): Promise<Walkthrough | undefined>;
  deleteWalkthrough(id: number): Promise<boolean>;
  
  // Recording Requests
  getRecordingRequest(id: number): Promise<RecordingRequest | undefined>;
  getAllRecordingRequests(): Promise<RecordingRequest[]>;
  createRecordingRequest(request: InsertRecordingRequest): Promise<RecordingRequest>;
  updateRecordingRequest(id: number, updates: Partial<InsertRecordingRequest>): Promise<RecordingRequest | undefined>;
  deleteRecordingRequest(id: number): Promise<boolean>;
  
  // Walkthrough Steps
  getWalkthroughSteps(walkthroughId: number): Promise<WalkthroughStep[]>;
  createWalkthroughStep(step: InsertWalkthroughStep): Promise<WalkthroughStep>;
  updateWalkthroughStep(id: number, step: Partial<InsertWalkthroughStep>): Promise<WalkthroughStep | undefined>;
  deleteWalkthroughStep(id: number): Promise<boolean>;
  
  // User Credentials
  getUserCredentials(userId: number): Promise<UserCredential[]>;
  createUserCredential(credential: InsertUserCredential): Promise<UserCredential>;
  updateUserCredential(id: number, credential: Partial<InsertUserCredential>): Promise<UserCredential | undefined>;
  deleteUserCredential(id: number): Promise<boolean>;
  
  // Walkthrough Ratings
  getWalkthroughRatings(walkthroughId: number): Promise<WalkthroughRating[]>;
  createWalkthroughRating(rating: InsertWalkthroughRating): Promise<WalkthroughRating>;
  getUserRatingForWalkthrough(walkthroughId: number, userId: number): Promise<WalkthroughRating | undefined>;
  updateWalkthroughRating(id: number, rating: Partial<InsertWalkthroughRating>): Promise<WalkthroughRating | undefined>;
  deleteWalkthroughRating(id: number): Promise<boolean>;
  
  // Dashboard
  getDashboardStats(): Promise<DashboardStats>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private walkthroughs: Map<number, Walkthrough>;
  private walkthroughSteps: Map<number, WalkthroughStep>;
  private userCredentials: Map<number, UserCredential>;
  private recordingRequests: Map<number, RecordingRequest>;
  private walkthroughRatings: Map<number, WalkthroughRating>;
  private currentUserId: number;
  private currentWalkthroughId: number;
  private currentStepId: number;
  private currentCredentialId: number;
  private currentRecordingRequestId: number;
  private currentRatingId: number;

  constructor() {
    this.users = new Map();
    this.walkthroughs = new Map();
    this.walkthroughSteps = new Map();
    this.userCredentials = new Map();
    this.recordingRequests = new Map();
    this.walkthroughRatings = new Map();
    this.currentUserId = 1;
    this.currentWalkthroughId = 1;
    this.currentStepId = 1;
    this.currentCredentialId = 1;
    this.currentRecordingRequestId = 1;
    this.currentRatingId = 1;
    
    // Initialize with a demo user
    this.createUser({
      username: "admin",
      password: "admin123",
      email: "admin@shookla.ai",
      role: "admin"
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || "user",
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Walkthroughs
  async getWalkthrough(id: number): Promise<WalkthroughWithSteps | undefined> {
    const walkthrough = this.walkthroughs.get(id);
    if (!walkthrough) return undefined;
    
    const steps = await this.getWalkthroughSteps(id);
    const createdByUser = walkthrough.createdBy ? await this.getUser(walkthrough.createdBy) : undefined;
    
    return {
      ...walkthrough,
      steps: steps.sort((a, b) => a.stepNumber - b.stepNumber),
      createdByUser: createdByUser ? { id: createdByUser.id, username: createdByUser.username } : undefined
    };
  }

  async getAllWalkthroughs(): Promise<WalkthroughWithSteps[]> {
    const walkthroughPromises = Array.from(this.walkthroughs.keys()).map(id => this.getWalkthrough(id));
    const results = await Promise.all(walkthroughPromises);
    return results.filter((w): w is WalkthroughWithSteps => w !== undefined);
  }

  async getWalkthroughsByUser(userId: number): Promise<WalkthroughWithSteps[]> {
    const userWalkthroughs = Array.from(this.walkthroughs.values()).filter(w => w.createdBy === userId);
    const walkthroughPromises = userWalkthroughs.map(w => this.getWalkthrough(w.id));
    const results = await Promise.all(walkthroughPromises);
    return results.filter((w): w is WalkthroughWithSteps => w !== undefined);
  }

  async createWalkthrough(insertWalkthrough: InsertWalkthrough): Promise<Walkthrough> {
    const id = this.currentWalkthroughId++;
    const walkthrough: Walkthrough = {
      ...insertWalkthrough,
      id,
      status: insertWalkthrough.status || "draft",
      videoUrl: insertWalkthrough.videoUrl || null,
      scriptContent: insertWalkthrough.scriptContent || null,
      duration: insertWalkthrough.duration || null,
      emailSent: insertWalkthrough.emailSent || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.walkthroughs.set(id, walkthrough);
    return walkthrough;
  }

  async updateWalkthrough(id: number, updates: Partial<InsertWalkthrough>): Promise<Walkthrough | undefined> {
    const existing = this.walkthroughs.get(id);
    if (!existing) return undefined;
    
    const updated: Walkthrough = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };
    this.walkthroughs.set(id, updated);
    return updated;
  }

  async deleteWalkthrough(id: number): Promise<boolean> {
    // Delete associated steps
    const steps = await this.getWalkthroughSteps(id);
    steps.forEach(step => this.walkthroughSteps.delete(step.id));
    
    return this.walkthroughs.delete(id);
  }

  // Walkthrough Steps
  async getWalkthroughSteps(walkthroughId: number): Promise<WalkthroughStep[]> {
    return Array.from(this.walkthroughSteps.values()).filter(step => step.walkthroughId === walkthroughId);
  }

  async createWalkthroughStep(insertStep: InsertWalkthroughStep): Promise<WalkthroughStep> {
    const id = this.currentStepId++;
    const step: WalkthroughStep = { 
      ...insertStep, 
      id,
      data: insertStep.data || null,
      walkthroughId: insertStep.walkthroughId || null,
      targetElement: insertStep.targetElement || null
    };
    this.walkthroughSteps.set(id, step);
    return step;
  }

  async updateWalkthroughStep(id: number, updates: Partial<InsertWalkthroughStep>): Promise<WalkthroughStep | undefined> {
    const existing = this.walkthroughSteps.get(id);
    if (!existing) return undefined;
    
    const updated: WalkthroughStep = { ...existing, ...updates };
    this.walkthroughSteps.set(id, updated);
    return updated;
  }

  async deleteWalkthroughStep(id: number): Promise<boolean> {
    return this.walkthroughSteps.delete(id);
  }

  // User Credentials
  async getUserCredentials(userId: number): Promise<UserCredential[]> {
    return Array.from(this.userCredentials.values()).filter(cred => cred.userId === userId);
  }

  async createUserCredential(insertCredential: InsertUserCredential): Promise<UserCredential> {
    const id = this.currentCredentialId++;
    const credential: UserCredential = {
      ...insertCredential,
      id,
      userId: insertCredential.userId || null,
      createdAt: new Date()
    };
    this.userCredentials.set(id, credential);
    return credential;
  }

  async updateUserCredential(id: number, updates: Partial<InsertUserCredential>): Promise<UserCredential | undefined> {
    const existing = this.userCredentials.get(id);
    if (!existing) return undefined;
    
    const updated: UserCredential = { ...existing, ...updates };
    this.userCredentials.set(id, updated);
    return updated;
  }

  async deleteUserCredential(id: number): Promise<boolean> {
    return this.userCredentials.delete(id);
  }

  // Recording Requests
  async getRecordingRequest(id: number): Promise<RecordingRequest | undefined> {
    return this.recordingRequests.get(id);
  }

  async getAllRecordingRequests(): Promise<RecordingRequest[]> {
    return Array.from(this.recordingRequests.values());
  }

  async createRecordingRequest(insertRequest: InsertRecordingRequest): Promise<RecordingRequest> {
    const id = this.currentRecordingRequestId++;
    const request: RecordingRequest = {
      ...insertRequest,
      id,
      status: insertRequest.status || "pending",
      walkthroughId: insertRequest.walkthroughId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.recordingRequests.set(id, request);
    return request;
  }

  async updateRecordingRequest(id: number, updates: Partial<InsertRecordingRequest>): Promise<RecordingRequest | undefined> {
    const existing = this.recordingRequests.get(id);
    if (!existing) return undefined;
    
    const updated: RecordingRequest = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };
    this.recordingRequests.set(id, updated);
    return updated;
  }

  async deleteRecordingRequest(id: number): Promise<boolean> {
    return this.recordingRequests.delete(id);
  }

  // Walkthrough Ratings
  async getWalkthroughRatings(walkthroughId: number): Promise<WalkthroughRating[]> {
    return Array.from(this.walkthroughRatings.values()).filter(rating => rating.walkthroughId === walkthroughId);
  }

  async createWalkthroughRating(insertRating: InsertWalkthroughRating): Promise<WalkthroughRating> {
    const id = this.currentRatingId++;
    const rating: WalkthroughRating = {
      ...insertRating,
      id,
      createdAt: new Date()
    };
    this.walkthroughRatings.set(id, rating);
    return rating;
  }

  async getUserRatingForWalkthrough(walkthroughId: number, userId: number): Promise<WalkthroughRating | undefined> {
    return Array.from(this.walkthroughRatings.values()).find(
      rating => rating.walkthroughId === walkthroughId && rating.userId === userId
    );
  }

  async updateWalkthroughRating(id: number, updates: Partial<InsertWalkthroughRating>): Promise<WalkthroughRating | undefined> {
    const existing = this.walkthroughRatings.get(id);
    if (!existing) return undefined;

    const updated: WalkthroughRating = {
      ...existing,
      ...updates
    };
    this.walkthroughRatings.set(id, updated);
    return updated;
  }

  async deleteWalkthroughRating(id: number): Promise<boolean> {
    return this.walkthroughRatings.delete(id);
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const totalWalkthroughs = this.walkthroughs.size;
    const activeUsers = Array.from(this.users.values()).filter(u => u.role !== 'archived').length;
    
    return {
      totalWalkthroughs,
      activeUsers,
      completionRate: "94.2%",
      avgDuration: "8.4s"
    };
  }
}

export const storage = new MemStorage();
