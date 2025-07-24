import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as admin from 'firebase-admin';
import nodemailer from 'nodemailer';
import type { IStorage } from './storage';

// Initialize OpenAI for AI script generation
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
}) : null;

// Initialize Gemini as fallback
const gemini = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Initialize Firebase Admin
let firebaseApp: admin.app.App | null = null;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
} catch (error) {
  console.warn('Firebase not configured:', error);
}

// Create email transporter using Gmail SMTP with enhanced configuration
let emailTransporter: nodemailer.Transporter | null = null;
if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
  emailTransporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  });
  
  // Don't verify during initialization to avoid blocking startup
  console.log('Email transporter configured with Gmail SMTP');
}

export interface RecordingSession {
  id: string;
  requestId: number;
  targetUrl: string;
  username: string;
  password: string;
  userPrompt: string;
  email: string;
  emailSent?: boolean;
  emailError?: string;
  status: 'pending' | 'recording' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  filePath?: string;
  scriptContent?: string;
  error?: string;
}

export class RecordingService {
  private activeSessions = new Map<string, RecordingSession>();
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  // Generate AI-powered step suggestions from description
  async generateStepSuggestions(description: string, targetApp: string, targetUrl: string): Promise<Array<{
    stepNumber: number;
    actionType: 'click' | 'type' | 'wait' | 'navigate' | 'tooltip';
    targetElement: string;
    instructions: string;
    data?: any;
  }>> {
    const prompt = `Based on this walkthrough description for ${targetApp} at ${targetUrl}:

"${description}"

Generate a detailed step-by-step action plan. Return a JSON array of steps with this exact format:
[
  {
    "stepNumber": 1,
    "actionType": "navigate",
    "targetElement": "url",
    "instructions": "Navigate to the target page",
    "data": "${targetUrl}"
  },
  {
    "stepNumber": 2,
    "actionType": "click",
    "targetElement": "#login-button",
    "instructions": "Click the login button to access the system",
    "data": null
  },
  {
    "stepNumber": 3,
    "actionType": "type",
    "targetElement": "#username",
    "instructions": "Enter your username in the username field",
    "data": "[username]"
  },
  {
    "stepNumber": 4,
    "actionType": "tooltip",
    "targetElement": "#help-icon",
    "instructions": "Show helpful tip about this feature",
    "data": "This feature allows you to..."
  },
  {
    "stepNumber": 5,
    "actionType": "wait",
    "targetElement": "page",
    "instructions": "Wait for the page to load completely",
    "data": { "duration": 2000 }
  }
]

Action types available: click, type, wait, navigate, tooltip
- Use CSS selectors for targetElement (e.g., "#id", ".class", "[data-testid='value']")
- Make instructions clear and user-friendly
- Include realistic wait times for page loads
- Add tooltips to explain complex features
- Break complex tasks into simple, clear steps

Provide 5-12 logical steps that would accomplish the described walkthrough.`;

    try {
      // Try OpenAI first
      if (openai) {
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
            messages: [
              { role: "system", content: "You are an expert at creating detailed step-by-step UI walkthroughs. Always respond with valid JSON." },
              { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
          });

          const content = response.choices[0].message.content;
          if (content) {
            const parsed = JSON.parse(content);
            return Array.isArray(parsed) ? parsed : parsed.steps || [];
          }
        } catch (error) {
          console.warn('OpenAI step generation failed:', error);
        }
      }

      // Fallback to Gemini
      if (gemini) {
        try {
          const model = gemini.getGenerativeModel({ model: "gemini-2.5-pro" });
          const result = await model.generateContent({
            contents: [{
              role: "user",
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: {
                type: "object" as any,
                properties: {
                  steps: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        stepNumber: { type: "number" },
                        actionType: { type: "string" },
                        targetElement: { type: "string" },
                        instructions: { type: "string" },
                        data: { 
                          type: "string",
                          description: "Optional data for the step"
                        }
                      }
                    }
                  }
                }
              }
            }
          });

          const content = result.response.text();
          if (content) {
            const parsed = JSON.parse(content);
            return Array.isArray(parsed) ? parsed : parsed.steps || [];
          }
        } catch (error) {
          console.warn('Gemini step generation failed:', error);
        }
      }

      // Default fallback steps
      return [
        {
          stepNumber: 1,
          actionType: "navigate" as const,
          targetElement: "url",
          instructions: "Navigate to the target application",
          data: targetUrl
        },
        {
          stepNumber: 2,
          actionType: "tooltip" as const,
          targetElement: "body",
          instructions: "Welcome! This walkthrough will guide you through the process step by step.",
          data: "Follow each step carefully to complete the task successfully."
        },
        {
          stepNumber: 3,
          actionType: "click" as const,
          targetElement: "[data-main-action]",
          instructions: "Look for the main action button and click it to begin",
          data: null
        }
      ];
    } catch (error) {
      console.error('Step generation error:', error);
      return [];
    }
  }

  // Generate AI script using OpenAI with Gemini fallback
  async generateScript(userPrompt: string, targetApp: string): Promise<string> {
    const defaultScript = "Welcome to this walkthrough. We'll guide you through each step.";
    
    // Try OpenAI first
    if (openai) {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "system",
              content: `You are an expert at creating clear, concise walkthrough scripts for web applications. 
              Create a step-by-step narration script that guides users through the requested task. 
              The script should be friendly, professional, and easy to follow. 
              Keep each step under 2 sentences and use simple language.
              Respond with JSON in this format: { "script": "your script here" }`
            },
            {
              role: "user",
              content: `Create a walkthrough script for: "${userPrompt}" on ${targetApp}. 
              The script will be used as voice-over for a screen recording showing each step.`
            }
          ],
          response_format: { type: "json_object" },
        });

        const result = JSON.parse(response.choices[0].message.content || '{"script": ""}');
        return result.script || defaultScript;
      } catch (error) {
        console.warn('OpenAI API failed, trying Gemini fallback:', error);
      }
    }

    // Fallback to Gemini if OpenAI fails or is not configured
    if (gemini) {
      try {
        const model = gemini.getGenerativeModel({ 
          model: "gemini-2.0-flash-exp",
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "object",
              properties: {
                script: { type: "string" }
              },
              required: ["script"]
            }
          }
        });

        const prompt = `You are an expert at creating clear, concise walkthrough scripts for web applications. 
        Create a step-by-step narration script that guides users through the requested task. 
        The script should be friendly, professional, and easy to follow. 
        Keep each step under 2 sentences and use simple language.
        
        Create a walkthrough script for: "${userPrompt}" on ${targetApp}. 
        The script will be used as voice-over for a screen recording showing each step.`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        
        if (text) {
          const parsed = JSON.parse(text);
          return parsed.script || defaultScript;
        }
      } catch (error) {
        console.warn('Gemini API also failed:', error);
      }
    }

    // Return default script if both AI services fail
    console.warn('Both OpenAI and Gemini unavailable, using default script');
    return defaultScript;
  }

  // Start a new recording session
  async startRecording(request: {
    username: string;
    password: string;
    userPrompt: string;
    targetUrl: string;
    email: string;
    requestId: number;
  }): Promise<string> {
    const sessionId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: RecordingSession = {
      id: sessionId,
      requestId: request.requestId,
      targetUrl: request.targetUrl,
      username: request.username,
      password: request.password,
      userPrompt: request.userPrompt,
      email: request.email,
      status: 'pending'
    };

    this.activeSessions.set(sessionId, session);

    // Start the recording process asynchronously
    this.processRecording(sessionId).catch(error => {
      console.error(`Recording session ${sessionId} failed:`, error);
      this.updateSessionStatus(sessionId, 'failed', undefined, error.message);
    });

    return sessionId;
  }

  // Main recording process
  private async processRecording(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    try {
      // Update status to recording
      this.updateSessionStatus(sessionId, 'recording');

      // Generate AI script
      const script = await this.generateScript(session.userPrompt, session.targetUrl);
      session.scriptContent = script;

      // Simulate recording process (In production, this would integrate with actual recording tools)
      // For MVP, we'll create a mock video URL and process
      await this.simulateRecording(session);

      // Update status to processing
      this.updateSessionStatus(sessionId, 'processing');

      // Process the recording (add highlights, voice-over, etc.)
      await this.processVideo(session);

      // Create walkthrough record in database
      await this.saveWalkthroughToDatabase(session);

      // Update status to completed first
      this.updateSessionStatus(sessionId, 'completed');

      // Try to send email notification after completion (fire and forget)
      this.sendEmailNotification(session)
        .then(() => {
          session.emailSent = true;
          console.log(`Email notification sent successfully for session ${sessionId}`);
        })
        .catch((emailError) => {
          console.warn(`Email notification failed for session ${sessionId}:`, emailError);
          session.emailSent = false;
          session.emailError = emailError instanceof Error ? emailError.message : 'Unknown email error';
        });

    } catch (error) {
      console.error(`Recording process failed for session ${sessionId}:`, error);
      this.updateSessionStatus(sessionId, 'failed', undefined, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // Record actual walkthrough of the target application
  private async simulateRecording(session: RecordingSession): Promise<void> {
    const puppeteer = await import('puppeteer');
    const { PuppeteerScreenRecorder } = await import('puppeteer-screen-recorder');
    
    let browser;
    let recorder;
    
    try {
      console.log(`Starting browser recording for session ${session.id}`);
      
      // Launch browser with recording capabilities
      browser = await puppeteer.launch({
        headless: true, // Use headless mode for server environment
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_BIN || '/usr/bin/chromium',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--allow-running-insecure-content',
          '--window-size=1280,720',
          '--disable-gpu',
          '--disable-features=VizDisplayCompositor',
          '--user-data-dir=/app/.chrome',
          '--single-process'
        ]
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 720 });

      // Initialize screen recorder
      recorder = new PuppeteerScreenRecorder(page, {
        followNewTab: true,
        fps: 25,
        ffmpeg_Path: null, // Use system ffmpeg
        videoFrame: {
          width: 1280,
          height: 720,
        },
        videoCrf: 18,
        videoCodec: 'libx264',
        videoPreset: 'ultrafast',
        videoBitrate: 1000,
        autopad: {
          color: 'black',
        },
        aspectRatio: '16:9',
      });

      const videoPath = `./recordings/${session.id}.mp4`;
      
      // Ensure recordings directory exists
      const fs = await import('fs');
      const path = await import('path');
      const recordingsDir = path.dirname(videoPath);
      if (!fs.existsSync(recordingsDir)) {
        fs.mkdirSync(recordingsDir, { recursive: true });
      }

      await recorder.start(videoPath);

      // Navigate to target URL
      console.log(`Navigating to ${session.targetUrl}`);
      await page.goto(session.targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait for page to load
      await page.waitForTimeout(2000);

      // Perform basic authentication if credentials provided
      if (session.username && session.password) {
        console.log('Attempting to authenticate...');
        
        // Look for common login elements
        const usernameSelectors = [
          'input[name="username"]',
          'input[name="email"]', 
          'input[type="email"]',
          'input[id*="username"]',
          'input[id*="email"]',
          '#username',
          '#email',
          '.username',
          '.email'
        ];
        
        const passwordSelectors = [
          'input[name="password"]',
          'input[type="password"]',
          '#password',
          '.password'
        ];

        let usernameField = null;
        let passwordField = null;

        // Try to find username field
        for (const selector of usernameSelectors) {
          try {
            usernameField = await page.$(selector);
            if (usernameField) break;
          } catch (e) { /* continue */ }
        }

        // Try to find password field
        for (const selector of passwordSelectors) {
          try {
            passwordField = await page.$(selector);
            if (passwordField) break;
          } catch (e) { /* continue */ }
        }

        if (usernameField && passwordField) {
          await usernameField.type(session.username, { delay: 100 });
          await page.waitForTimeout(500);
          await passwordField.type(session.password, { delay: 100 });
          await page.waitForTimeout(500);
          
          // Try to find and click login button
          const loginSelectors = [
            'button[type="submit"]',
            'input[type="submit"]',
            'button:contains("Login")',
            'button:contains("Sign in")',
            '#login',
            '.login',
            '.signin'
          ];
          
          for (const selector of loginSelectors) {
            try {
              const loginButton = await page.$(selector);
              if (loginButton) {
                await loginButton.click();
                await page.waitForTimeout(3000);
                break;
              }
            } catch (e) { /* continue */ }
          }
        }
      }

      // Perform walkthrough actions based on user prompt
      console.log('Performing walkthrough actions...');
      await this.performWalkthroughActions(page, session.userPrompt);

      // Record for additional time to capture full interaction
      await page.waitForTimeout(3000);

      await recorder.stop();
      console.log(`Recording completed: ${videoPath}`);

      // Set the local file path for now - in production this would be uploaded to CDN
      session.videoUrl = `/api/recordings/${session.id}.mp4`;
      session.filePath = videoPath;

    } catch (error) {
      console.error('Recording failed:', error);
      if (recorder) {
        try {
          await recorder.stop();
        } catch (e) { /* ignore */ }
      }
      
      // Fallback to demo video if recording fails - note this would be a real recording in production
      session.videoUrl = `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`;
      console.warn('Browser recording failed, using demo video fallback. In production, this would use cloud recording infrastructure.');
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  // Perform walkthrough actions based on user prompt
  private async performWalkthroughActions(page: any, userPrompt: string): Promise<void> {
    // Basic interaction simulation based on prompt analysis
    const prompt = userPrompt.toLowerCase();
    
    // Scroll down to show more content
    await page.evaluate(() => window.scrollTo(0, 200));
    await page.waitForTimeout(1500);
    
    // Look for links and buttons mentioned in the prompt
    if (prompt.includes('click') || prompt.includes('button')) {
      const buttons = await page.$$('button, .btn, [role="button"]');
      if (buttons.length > 0) {
        // Click the first button found
        await buttons[0].scrollIntoView();
        await page.waitForTimeout(1000);
        await buttons[0].click();
        await page.waitForTimeout(2000);
      }
    }
    
    if (prompt.includes('link') || prompt.includes('navigate')) {
      const links = await page.$$('a[href]');
      if (links.length > 0) {
        // Click the first meaningful link
        for (const link of links.slice(0, 3)) {
          const href = await page.evaluate((el: any) => el.getAttribute('href'), link);
          if (href && !href.startsWith('#') && !href.includes('javascript:')) {
            await link.scrollIntoView();
            await page.waitForTimeout(1000);
            await link.click();
            await page.waitForTimeout(3000);
            break;
          }
        }
      }
    }
    
    // Scroll to bottom to show full page
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    
    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1500);
  }

  // Process the recorded video (add highlights, captions, etc.)
  private async processVideo(session: RecordingSession): Promise<void> {
    // In production, this would:
    // 1. Add mouse movement highlights
    // 2. Generate voice-over from script using TTS
    // 3. Add closed captions
    // 4. Optimize video for web playback
    // 5. Upload to CDN

    await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate processing time
  }

  // Send email notification with video links
  private async sendEmailNotification(session: RecordingSession): Promise<void> {
    if (!emailTransporter) {
      console.warn('Email transporter not configured, skipping email notification');
      throw new Error('Email transporter not configured');
    }

    // Test connection before sending
    try {
      await emailTransporter.verify();
    } catch (verifyError: any) {
      console.error('Email verification failed:', verifyError);
      throw new Error(`Email service unavailable: ${verifyError?.message || 'Unknown error'}`);
    }

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #8B5CF6, #A855F7); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Your Walkthrough is Ready!</h1>
        </div>
        
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Hello!</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Your requested walkthrough for "<strong>${session.userPrompt}</strong>" has been successfully recorded and processed.
          </p>
          
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #8B5CF6;">
            <h3 style="margin: 0 0 10px 0; color: #1f2937;">🎥 Video Walkthrough</h3>
            <p style="margin: 0 0 15px 0; color: #6b7280;">Watch the complete step-by-step tutorial:</p>
            <a href="${session.videoUrl}" 
               style="display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
              Watch Video Tutorial
            </a>
          </div>

          ${session.scriptContent ? `
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="margin: 0 0 10px 0; color: #1f2937;">📝 Tutorial Script</h3>
            <p style="margin: 0 0 15px 0; color: #6b7280;">Read the step-by-step instructions:</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 4px; font-family: monospace; white-space: pre-wrap; color: #374151;">${session.scriptContent}</div>
          </div>
          ` : ''}

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              This walkthrough was generated automatically by Shookla.ai. 
              If you have any questions or need additional help, please don't hesitate to reach out.
            </p>
          </div>
        </div>
        
        <div style="background: #1f2937; padding: 20px; text-align: center;">
          <p style="color: #9ca3af; margin: 0; font-size: 14px;">
            © 2025 Shookla.ai - Automated Walkthrough Platform
          </p>
        </div>
      </div>
    `;

    try {
      await emailTransporter.sendMail({
        from: process.env.GMAIL_USER || 'noreply@shookla.ai',
        to: session.email,
        subject: `Your "${session.userPrompt}" walkthrough is ready!`,
        html: emailContent
      });
      
      console.log(`Email notification sent to ${session.email} for session ${session.id}`);
    } catch (error) {
      console.error('Failed to send email notification:', error);
      throw error;
    }
  }

  // Update session status
  private updateSessionStatus(
    sessionId: string, 
    status: RecordingSession['status'], 
    videoUrl?: string, 
    error?: string
  ): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = status;
      if (videoUrl) session.videoUrl = videoUrl;
      if (error) session.error = error;
    }
  }

  // Get session status
  getSessionStatus(sessionId: string): RecordingSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  // Get all active sessions
  getAllSessions(): RecordingSession[] {
    return Array.from(this.activeSessions.values());
  }

  // Get full session data (for internal use)
  getSession(sessionId: string): RecordingSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  // Save completed walkthrough to database
  private async saveWalkthroughToDatabase(session: RecordingSession): Promise<void> {
    if (!this.storage) return;

    try {
      // Get admin user (ID 1) as the creator for API-generated walkthroughs
      const adminUser = await this.storage.getUser(1);
      if (!adminUser) {
        console.warn('Admin user not found, skipping walkthrough save');
        return;
      }

      // Create walkthrough record
      const walkthrough = await this.storage.createWalkthrough({
        title: `Walkthrough: ${session.userPrompt}`,
        description: `Automated walkthrough for ${session.targetUrl}`,
        targetApp: 'Web Application',
        targetUrl: session.targetUrl,
        userType: 'beginner',
        environment: 'web',
        scriptContent: session.scriptContent || 'Welcome to this walkthrough. We\'ll guide you through each step.',
        videoUrl: session.videoUrl || '',
        duration: 120, // Default duration in seconds
        createdBy: adminUser.id
      });

      // Update the recording request with the walkthrough ID
      await this.storage.updateRecordingRequest(session.requestId, {
        walkthroughId: walkthrough.id,
        status: 'completed'
      });

      console.log(`Walkthrough saved with ID: ${walkthrough.id}`);
    } catch (error) {
      console.error('Failed to save walkthrough to database:', error);
      // Don't throw - we don't want to fail the entire process if DB save fails
    }
  }

  // Test email configuration
  async testEmailConfiguration(testEmail: string): Promise<{ success: boolean; message: string }> {
    if (!emailTransporter) {
      return {
        success: false,
        message: "Email transporter not configured. Please check GMAIL_USER and GMAIL_APP_PASSWORD environment variables."
      };
    }

    try {
      // Test connection
      await emailTransporter.verify();
      
      // Send test email
      await emailTransporter.sendMail({
        from: process.env.GMAIL_USER || 'noreply@walkthroughs.app',
        to: testEmail,
        subject: 'Walkthroughs Email Test',
        html: `
          <h2>Email Configuration Test</h2>
          <p>This is a test email to verify that your email configuration is working correctly.</p>
          <p>If you received this email, your Gmail SMTP settings are properly configured!</p>
          <p><strong>Configuration Details:</strong></p>
          <ul>
            <li>SMTP Host: smtp.gmail.com</li>
            <li>Port: 587</li>
            <li>Sender: ${process.env.GMAIL_USER}</li>
          </ul>
        `
      });

      return {
        success: true,
        message: `Test email sent successfully to ${testEmail}`
      };
    } catch (error: any) {
      console.error('Email test failed:', error);
      return {
        success: false,
        message: `Email test failed: ${error?.message || 'Unknown error'}`
      };
    }
  }

  // Clean up completed sessions (optional, for memory management)
  cleanupCompletedSessions(): void {
    const entries = Array.from(this.activeSessions.entries());
    for (const [sessionId, session] of entries) {
      if (session.status === 'completed' || session.status === 'failed') {
        // Keep sessions for 24 hours before cleanup
        const sessionAge = Date.now() - parseInt(sessionId.split('_')[1]);
        if (sessionAge > 24 * 60 * 60 * 1000) {
          this.activeSessions.delete(sessionId);
        }
      }
    }
  }
}

// Recording service will be initialized in routes.ts with storage injection