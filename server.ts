import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini AI client to prevent startup failure if the API key is not yet set
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not defined.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// API Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Gemini Study Plan Generator API endpoint
app.post('/api/gemini/study-plan', async (req, res) => {
  try {
    const { assignments } = req.body;

    if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({ error: 'Please provide a list of pending assignments' });
    }

    let ai;
    try {
      ai = getAiClient();
    } catch (err: any) {
      // Return clear message but don't blow up the server
      return res.status(500).json({
        error: 'Gemini API not configured. To enable AI study helper, please add GEMINI_API_KEY in Settings > Secrets.',
        details: err.message,
      });
    }

    const assignmentsText = assignments
      .map((a: any, index: number) => {
        const dueDateStr = a.dueDate
          ? `due on ${a.dueDate.year}-${a.dueDate.month}-${a.dueDate.day}`
          : 'no due date';
        return `${index + 1}. [${a.courseName || 'Unassigned'}] ${a.title} - ${dueDateStr}. Description: ${a.description || 'No description'}`;
      })
      .join('\n');

    const prompt = `You are an expert high-school and college academic counselor and study coach.
Analyze the following pending assignments, identify their urgency, conceptual dependencies, and provide a structured, highly motivational master study plan and focus slots schedule.

Assignments list:
${assignmentsText}

Please return the response as a structured JSON matching the requested schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Tailored study strategies, sequence advice, and memory helper points.',
            },
            schedule: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING, description: 'Slot duration (e.g. 4:00 PM - 5:15 PM)' },
                  task: { type: Type.STRING, description: 'Specific active-recall or focus action item' },
                  priority: { type: Type.STRING, description: 'HIGH, MEDIUM, or LOW priority level' },
                },
                required: ['time', 'task', 'priority'],
              },
              description: 'Dynamic time slots allocating study sessions to specific tasks.',
            },
            summary: {
              type: Type.STRING,
              description: 'An encouraging, executive overview summarizing workload depth and actionable outlook.',
            },
          },
          required: ['tips', 'schedule', 'summary'],
        },
      },
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error('Emply output received from Gemini API');
    }

    const payload = JSON.parse(textOutput.trim());
    return res.json(payload);

  } catch (error: any) {
    console.error('Failure inside study-plan generations:', error);
    return res.status(500).json({
      error: 'Failed to generate study plan.',
      details: error.message,
    });
  }
});

// Google OAuth URL generation route
app.get('/api/auth/google-url', (req, res) => {
  const customClientId = req.query.clientId as string;
  const client_id = customClientId || process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID || process.env.OAUTH_CLIENT_ID || "";
  
  if (!client_id) {
    return res.status(400).json({
      error: 'Google OAuth Client ID is not configured in secrets. Please configure it in Settings or supply it as VITE_CLIENT_ID.'
    });
  }

  const appUrl = (process.env.APP_URL || '').replace(/\/$/, "");
  const redirectUri = `${appUrl}/auth/callback`;

  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/classroom.courses.readonly',
    'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
    'https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly',
    'https://www.googleapis.com/auth/classroom.announcements.readonly',
    'https://www.googleapis.com/auth/classroom.rosters.readonly',
    'https://www.googleapis.com/auth/classroom.profile.emails',
    'https://www.googleapis.com/auth/classroom.profile.photos',
  ].join(' ');

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
    client_id,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes,
    access_type: 'offline',
    prompt: 'consent'
  }).toString();

  res.json({ url: authUrl });
});

// Google OAuth callback route
app.get(['/auth/callback', '/auth/callback/'], async (req, res) => {
  const { code } = req.query;
  const client_id = process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID || process.env.OAUTH_CLIENT_ID || "";
  const client_secret = process.env.CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || process.env.OAUTH_CLIENT_SECRET || "";

  if (!code) {
    return res.status(400).send('Authorization code is missing from Google.');
  }

  const appUrl = (process.env.APP_URL || '').replace(/\/$/, "");
  const redirectUri = `${appUrl}/auth/callback`;

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id,
        client_secret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      }).toString()
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error('Failed to exchange Google OAuth token:', errBody);
      return res.status(400).send(`
        <h3>Failed to exchange authorization code for Google access token.</h3>
        <p>Please verify that your Google Credentials (CLIENT_ID and CLIENT_SECRET) match what is configured in AI Studio Secrets panel.</p>
        <p>Redirect URI configured: <code>${redirectUri}</code></p>
        <pre>${errBody}</pre>
        <br/><button onclick="window.close()">Close Sign-In Window</button>
      `);
    }

    const tokenData: any = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Fetch Google profile user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    let userData = { name: "Google Scholar", email: "classroom@google.com", picture: undefined };
    if (userRes.ok) {
      userData = await userRes.json();
    }

    // Return HTML page to signal success to the parent window and safely close
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google Authentication Success</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #f8fafc; color: #1e293b; margin: 0; text-align: center; }
            .container { padding: 2.5rem; background: white; border-radius: 1.5rem; box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.1), 0 4px 6px -2px rgba(79, 70, 229, 0.05); max-width: 440px; width: 90%; border: 1px solid #e0e7ff; }
            h1 { font-weight: 800; font-size: 1.75rem; color: #4338ca; margin: 0 0 0.75rem; }
            p { font-size: 0.95rem; color: #475569; line-height: 1.6; margin: 0 0 1.25rem; }
            .user-box { display: flex; items-center: center; justify-content: center; gap: 0.75rem; padding: 0.75rem 1rem; background: #f0fdf4; border-radius: 0.75rem; border: 1px solid #bbf7d0; margin-bottom: 1.5rem; font-weight: 600; color: #15803d; font-size: 0.9rem; }
            .spinner { border: 3px solid #e2e8f0; border-top: 3px solid #4f46e5; border-radius: 50%; width: 20px; height: 20px; animation: spin 0.8s linear infinite; margin: 1rem auto 0; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Workspace Link Active!</h1>
            <p>Your Google Classroom workspace has successfully authorized and synced academic channels.</p>
            <div class="user-box">
              Connected: ${userData.email}
            </div>
            <p style="font-size: 0.85rem; color: #94a3b8;">This window will close automatically as we redirect your dashboard view...</p>
            <div class="spinner"></div>
          </div>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage({
                  type: 'OAUTH_AUTH_SUCCESS',
                  auth: {
                    user: ${JSON.stringify(userData)},
                    accessToken: ${JSON.stringify(accessToken)},
                    expiresIn: ${tokenData.expires_in || 3600}
                  }
                }, '*');
                setTimeout(() => window.close(), 800);
              } else {
                window.location.href = '/';
              }
            } catch (err) {
              console.error("Failed to post message back to main window:", err);
              document.write("<p style='color:red;'>Could not auto-close. Please close this tab manually and refresh your main classroom portal tab.</p>");
            }
          </script>
        </body>
      </html>
    `);

  } catch (error: any) {
    console.error('Exception in Google OAuth callback:', error);
    res.status(500).send(`<h3>Internal OAuth Callback Exception:</h3><pre>${error.message}</pre>`);
  }
});

// Serve Frontend using Vite Dev server or Production static assets
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve HTML entry for SPA routing paths
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Google Classroom Dashboard server listening on http://localhost:${PORT}`);
  });
}

startServer();
