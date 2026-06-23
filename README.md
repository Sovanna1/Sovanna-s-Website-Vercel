<div align="center">
  <img src="https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=1200&h=450" alt="Classroom Connect Header" style="border-radius: 1.5rem; margin-bottom: 2rem; border: 1px solid #e2e8f0; width: 100%; object-fit: cover;" referrerPolicy="no-referrer" />
</div>

# 🎓 Classroom Connect: High School Assignment Tracker

An elegant, student-centric application designed for high school student rosters (Grades 9-12). It compiles coursework deadlines, student submission statuses, grading timelines, classmates directories, and upcoming announcements into one unified dashboard.

---

## ✨ Features

- **Assignments Hub & Planner**: Dynamically filtered lists categorized by due-date pressure (due today, overdue, upcoming, graded, or submitted).
- **Interactive Classrooms Explorer**: Highlighting enrollment lists, syllabus details, and options to customize course tracks.
- **Grades & Progress Analytics**: Beautiful, high-fidelity statistics visualizing point metrics, completed workloads, and average performance scores.
- **Unified Peer Roster**: Secure contact listings for teachers, section classmates, and direct dial/email quick portals.
- **Shared Homework Sheet**: Collaborative board where students can log, share, and cross-reference peer assignments across Grades 9-12 tracks.
- **Auto-Sync Engine Simulation**: Background sync thread simulating real-time update notifications (such as coursework grades coming back from teachers).

---

## 💻 Run Locally in VS Code

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (version 18+ recommended) installed on your system.

### 2. Quick-Start Setup

1. **Clone & Open:** Open this project directory inside VS Code.
2. **Install Dependencies:**
   Open the VS Code Terminal (`Ctrl + `` or `Cmd + ``) and install the packages:
   ```bash
   npm install
   ```
3. **Configure Environment:**
   While the application runs completely offline-first with simulated data by default, you can configure your API credentials inside your `.env` file for cloud components:
   ```env
   # .env
   GEMINI_API_KEY="YOUR_KEY_HERE"
   ```

---

## 🚀 One-Click Launch in VS Code (F5)

This repository includes a pre-configured `.vscode/launch.json` workspace. You can choose the launch method that fits your environment:

### Method A: Regular Developer Mode (Requires Node.js & npm)
1. Go to the **Run & Debug** panel on the left (`Ctrl+Shift+D` / `Cmd+Shift+D`).
2. Select **"Classroom Connect: Launch Loopback (127.0.0.1:3000 - Recommended)"**.
3. Press **F5** (or click the green Play icon).
4. VS Code will automatically run `npm install`, start `npm run dev`, and open the browser.

### Method B: Portable Static Server (Zero-Install / NO Node.js / NO npm!)
If you do not have Node.js or npm installed, you can still run the full application with a single click using **Python** (which is preloaded on macOS, Linux, and Windows):
1. Go to the **Run & Debug** panel on the left (`Ctrl+Shift+D` / `Cmd+Shift+D`).
2. Select **"Portable Launch: Python Static Server (Zero-Install, 127.0.0.1:3000)"**.
3. Press **F5** (or click the green Play icon).
4. VS Code will automatically execute a background Python static server on the pre-compiled `dist/` directory and open your browser at `http://127.0.0.1:3000` with the fully working app!

### Method C: VS Code Live Preview/Live Server (Zero-Install / NO Node.js / NO npm!)
If you prefer not using Python, you can use VS Code's rich extensions to serve the app directly:
1. Open the **Run & Debug** panel on the left.
2. Select **"Portable Launch: VS Code Live Server (Zero-Install, 127.0.0.1:5500)"**.
3. Press **F5** or run your local VS Code Live Server extension.
4. Alternatively, **right-click `dist/index.html`** and select **"Show Preview"** to run Microsoft's embedded Live Preview directly inside your VS Code panel! No command-line tools needed!

---

## 🔍 Troubleshooting Local Connection (`ERR_CONNECTION_REFUSED`)

If your browser shows `This site can’t be reached` or `localhost refused to connect` when you press F5, follow these steps:

### 1. Modern DNS Issue: Use 127.0.0.1 instead of localhost
Modern operating systems (like Windows 11 and macOS) often map `localhost` to the IPv6 loopback interface (`::1`). However, some development servers only bind to the IPv4 loopback (`127.0.0.1`). If you try to open `localhost`, the browser tries IPv6 and gets `ERR_CONNECTION_REFUSED`.
* **Fix**: Use our recommended Launch configuration: **Classroom Connect: Launch Loopback (127.0.0.1:3000 - Recommended)**, or navigate directly to `http://127.0.0.1:3000` in your browser.

### 2. Another Application is Already Running on Port 3000
If you have another React, Node, or development server running on port `3000`, the application is now configured with an intelligent, dynamic fallback for local execution! 
* **Automatic Port Fallback**: In VS Code / local environments, `strictPort` is automatically set to `false`. If port `3000` is already in use, Vite will automatically bind to the next available port (e.g., `3001` or `3002`) rather than throwing a fatal error or crashing.
* **Production / Cloud Platform**: In the cloud container environment, the system strictly enforces port `3000` to handle reverse proxy routing perfectly.

### 3. Absolute No-Host-Install Alternative: Built static preview
If you build the project once using `npm run build`, we have configured Vite with **relative asset path resolution (`base: './'`)**. 
This means you can easily double-click `dist/index.html` to open it in your browser, or use the VS Code **Live Server** extension on the `dist` folder directly, with **zero configuration or server installs** needed! Highly portable across all systems!

---

## 🛠️ Tech Stack

- **Framework:** React 19 (TypeScript) & Vite
- **Styling:** Tailwind CSS (Modern dynamic layouts with responsive grid panels)
- **Animations:** Motion (`motion/react` layout transitions)
- **Icons:** Lucide React
- **Data Analytics:** Recharts / D3 engine APIs
