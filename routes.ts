import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { RecordingService } from "./recording";

// Initialize recording service with storage
const recordingService = new RecordingService(storage);
import { insertWalkthroughSchema, insertWalkthroughStepSchema, insertUserSchema, insertUserCredentialSchema, insertRecordingRequestSchema, insertWalkthroughRatingSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Walkthroughs
  app.get("/api/walkthroughs", async (req, res) => {
    try {
      const walkthroughs = await storage.getAllWalkthroughs();
      res.json(walkthroughs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch walkthroughs" });
    }
  });

  app.get("/api/walkthroughs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const walkthrough = await storage.getWalkthrough(id);
      if (!walkthrough) {
        return res.status(404).json({ error: "Walkthrough not found" });
      }
      res.json(walkthrough);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch walkthrough" });
    }
  });

  const createWalkthroughSchema = insertWalkthroughSchema.extend({
    steps: z.array(insertWalkthroughStepSchema.omit({ walkthroughId: true })).optional()
  });

  app.post("/api/walkthroughs", async (req, res) => {
    try {
      const parsed = createWalkthroughSchema.parse(req.body);
      const { steps, ...walkthroughData } = parsed;
      
      const walkthrough = await storage.createWalkthrough(walkthroughData);
      
      // Create steps if provided
      if (steps && steps.length > 0) {
        for (const stepData of steps) {
          await storage.createWalkthroughStep({
            ...stepData,
            walkthroughId: walkthrough.id
          });
        }
      }
      
      const walkthroughWithSteps = await storage.getWalkthrough(walkthrough.id);
      res.status(201).json(walkthroughWithSteps);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create walkthrough" });
    }
  });

  app.put("/api/walkthroughs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parsed = insertWalkthroughSchema.partial().parse(req.body);
      
      const walkthrough = await storage.updateWalkthrough(id, parsed);
      if (!walkthrough) {
        return res.status(404).json({ error: "Walkthrough not found" });
      }
      
      const walkthroughWithSteps = await storage.getWalkthrough(id);
      res.json(walkthroughWithSteps);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update walkthrough" });
    }
  });

  app.delete("/api/walkthroughs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteWalkthrough(id);
      if (!deleted) {
        return res.status(404).json({ error: "Walkthrough not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete walkthrough" });
    }
  });

  // Walkthrough steps
  app.post("/api/walkthroughs/:id/steps", async (req, res) => {
    try {
      const walkthroughId = parseInt(req.params.id);
      const parsed = insertWalkthroughStepSchema.omit({ walkthroughId: true }).parse(req.body);
      
      const step = await storage.createWalkthroughStep({
        ...parsed,
        walkthroughId
      });
      res.status(201).json(step);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create step" });
    }
  });

  app.put("/api/steps/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parsed = insertWalkthroughStepSchema.partial().parse(req.body);
      
      const step = await storage.updateWalkthroughStep(id, parsed);
      if (!step) {
        return res.status(404).json({ error: "Step not found" });
      }
      res.json(step);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update step" });
    }
  });

  app.delete("/api/steps/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteWalkthroughStep(id);
      if (!deleted) {
        return res.status(404).json({ error: "Step not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete step" });
    }
  });

  // Users
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(({ password, ...user }) => user)); // Don't send passwords
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const parsed = insertUserSchema.parse(req.body);
      const user = await storage.createUser(parsed);
      const { password, ...userResponse } = user;
      res.status(201).json(userResponse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // User credentials
  app.get("/api/users/:id/credentials", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const credentials = await storage.getUserCredentials(userId);
      res.json(credentials.map(({ encryptedCredentials, ...cred }) => cred)); // Don't send actual credentials
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user credentials" });
    }
  });

  app.post("/api/users/:id/credentials", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const parsed = insertUserCredentialSchema.omit({ userId: true }).parse(req.body);
      
      const credential = await storage.createUserCredential({
        ...parsed,
        userId
      });
      const { encryptedCredentials, ...credResponse } = credential;
      res.status(201).json(credResponse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create credential" });
    }
  });

  // Recording API endpoints
  const recordingRequestSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
    userPrompt: z.string().min(1, "User prompt is required"),
    targetUrl: z.string().url("Valid URL is required"),
    email: z.string().email("Valid email is required")
  });

  // Create new recording request
  app.post("/api/record", async (req, res) => {
    try {
      const parsed = recordingRequestSchema.parse(req.body);
      
      // Create recording request in storage
      const recordingRequest = await storage.createRecordingRequest(parsed);
      
      // Start the recording session
      const sessionId = await recordingService.startRecording({
        ...parsed,
        requestId: recordingRequest.id
      });
      
      res.status(201).json({
        message: "Recording request created successfully",
        requestId: recordingRequest.id,
        sessionId: sessionId,
        status: "pending"
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error('Recording request error:', error);
      res.status(500).json({ error: "Failed to create recording request" });
    }
  });

  // Get recording status
  app.get("/api/record/:sessionId/status", async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      const session = recordingService.getSessionStatus(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Recording session not found" });
      }
      
      res.json({
        sessionId: session.id,
        status: session.status,
        videoUrl: session.videoUrl,
        error: session.error,
        emailSent: session.emailSent,
        emailError: session.emailError
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get recording status" });
    }
  });

  // Get all recording requests (admin endpoint)
  app.get("/api/recordings", async (req, res) => {
    try {
      const requests = await storage.getAllRecordingRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recording requests" });
    }
  });

  // Get all active sessions (admin endpoint)
  app.get("/api/sessions", async (req, res) => {
    try {
      const sessions = recordingService.getAllSessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active sessions" });
    }
  });

  // Serve recorded video files
  app.get('/api/recordings/:sessionId.mp4', async (req, res) => {
    const { sessionId } = req.params;
    const session = recordingService.getSession(sessionId);
    
    if (!session || !session.filePath) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    const fs = await import('fs');
    
    try {
      const filePath = session.filePath;
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Video file not found' });
      }
      
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;
      const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(1);
      
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Length', fileSize);
      res.setHeader('Content-Disposition', `inline; filename="${sessionId}.mp4"`);
      res.setHeader('X-File-Size-MB', fileSizeMB);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    } catch (error) {
      console.error('Error serving video:', error);
      res.status(500).json({ error: 'Failed to serve video' });
    }
  });

  // Download recorded video files
  app.get('/api/recordings/:sessionId/download', async (req, res) => {
    const { sessionId } = req.params;
    const session = recordingService.getSession(sessionId);
    
    if (!session || !session.filePath) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    const fs = await import('fs');
    
    try {
      const filePath = session.filePath;
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Video file not found' });
      }
      
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;
      const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(1);
      
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Length', fileSize);
      res.setHeader('Content-Disposition', `attachment; filename="walkthrough-${sessionId}.mp4"`);
      res.setHeader('X-File-Size-MB', fileSizeMB);
      
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    } catch (error) {
      console.error('Error downloading video:', error);
      res.status(500).json({ error: 'Failed to download video' });
    }
  });

  // Walkthrough Ratings
  app.get("/api/walkthroughs/:walkthroughId/ratings", async (req, res) => {
    try {
      const walkthroughId = parseInt(req.params.walkthroughId);
      const ratings = await storage.getWalkthroughRatings(walkthroughId);
      res.json(ratings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ratings" });
    }
  });

  app.post("/api/walkthroughs/:walkthroughId/ratings", async (req, res) => {
    try {
      const walkthroughId = parseInt(req.params.walkthroughId);
      const parsed = insertWalkthroughRatingSchema.parse({
        ...req.body,
        walkthroughId,
        userId: 1 // For demo purposes - would use authenticated user ID
      });
      
      // Check if user already rated this walkthrough
      const existingRating = await storage.getUserRatingForWalkthrough(walkthroughId, parsed.userId);
      if (existingRating) {
        // Update existing rating
        const updated = await storage.updateWalkthroughRating(existingRating.id, {
          difficulty: parsed.difficulty,
          satisfaction: parsed.satisfaction,
          comment: parsed.comment
        });
        return res.json(updated);
      }
      
      // Create new rating
      const rating = await storage.createWalkthroughRating(parsed);
      res.status(201).json(rating);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid rating data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create rating" });
    }
  });

  app.get("/api/walkthroughs/:walkthroughId/user-rating", async (req, res) => {
    try {
      const walkthroughId = parseInt(req.params.walkthroughId);
      const userId = 1; // For demo purposes - would use authenticated user ID
      const rating = await storage.getUserRatingForWalkthrough(walkthroughId, userId);
      res.json(rating || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user rating" });
    }
  });

  // Generate AI step suggestions endpoint
  app.post("/api/generate-steps", async (req, res) => {
    try {
      const { description, targetApp, targetUrl } = req.body;
      
      if (!description || !targetApp || !targetUrl) {
        return res.status(400).json({ 
          error: "Missing required fields: description, targetApp, targetUrl" 
        });
      }

      const steps = await recordingService.generateStepSuggestions(description, targetApp, targetUrl);
      res.json({ steps });
    } catch (error) {
      console.error('Step generation error:', error);
      res.status(500).json({ 
        error: "Failed to generate step suggestions",
        details: (error as any)?.message || 'Unknown error'
      });
    }
  });

  app.post("/api/test-email", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email address required" });
      }

      const testResult = await recordingService.testEmailConfiguration(email);
      res.json(testResult);
    } catch (error) {
      console.error('Email test error:', error);
      res.status(500).json({ 
        error: "Email test failed", 
        details: (error as any)?.message || 'Unknown error'
      });
    }
  });

  // Health check endpoint for Railway deployment
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'walkthrough-recording-api',
      version: '1.0.0'
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
