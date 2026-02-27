# Tony Mission Control - Technical Specification

**Repository:** https://github.com/tony-c3a/tony-mission-control  
**Status:** Planning Phase  
**Created:** February 27, 2026

## 🎯 Vision

A real-time mission control dashboard that serves as the central hub for Chris and Tony's collaboration. Think NASA mission control meets modern task management - complete visibility into AI agent operations, tasks, data, and communication.

---

## 🏗️ System Architecture

### Tech Stack

**Frontend:**
- **Next.js 14** (App Router) - React framework with SSR/SSG
- **TypeScript** - Type safety across the stack
- **Tailwind CSS** - Rapid UI development
- **Framer Motion** - Smooth animations for Tony's avatar
- **shadcn/ui** - Beautiful, accessible UI components
- **Recharts** - Data visualization (time tracking, habits)
- **React Query** - Data fetching and caching

**Backend:**
- **Next.js API Routes** - Serverless API endpoints
- **Node.js** - Runtime environment
- **SQLite** (via better-sqlite3) - Local database for aggregated data
- **Server-Sent Events (SSE)** - Real-time updates from Tony to dashboard

**Data Integration:**
- **File System Watchers** - Monitor ~/clawd/* directories for changes
- **OpenClaw Session API** - Fetch active sessions, status, sub-agents
- **Git Integration** - Track commits, pushes to show activity

**Deployment:**
- **PM2** - Process manager for Next.js server
- **Nginx** - Reverse proxy
- **Host:** srv1296870 (current server)
- **Domain:** mission.cytsoftware.com (or subdomain TBD)

---

## 📊 Core Features

### 1. **Agent Status Monitor**
Real-time visualization of Tony's current state:

- **Avatar Animation:**
  - 🟢 **Active** - Working on tasks (glowing, animated)
  - 🟡 **Idle** - Waiting for input (pulsing softly)
  - 🔴 **Busy** - Multiple sessions running (spinning)
  - 💤 **Sleeping** - Off-hours, no active work

- **Current Activity:**
  - What Tony is working on right now
  - Last action timestamp
  - Current tool being used
  - Session info (model, tokens, runtime)

- **Open Sessions:**
  - Count of active OpenClaw sessions
  - Sub-agent list with status
  - Cron jobs running
  - Background processes (tmux sessions)

### 2. **Ideas Hub**
Centralized view of all captured ideas:

- **Data Source:** `~/clawd/ideas/`
- **Features:**
  - Grid/list view of all ideas
  - Filter by tags (#product, #cyt, #ai, etc.)
  - Search functionality
  - Sort by date, priority, status
  - Click to expand full context
  - Add new ideas directly from dashboard
  - Archive/delete ideas
  - Export to markdown

### 3. **Task Management**
Full task lifecycle management:

- **Data Source:** `~/clawd/todos/`
- **Features:**
  - Create tasks with:
    - Title, description
    - Tags (#work, #personal, #cyt, etc.)
    - Due date picker
    - Priority level (!urgent)
    - Assignment (to Tony or Chris)
  - **Tony's Queue:**
    - Visual representation of assigned tasks
    - Show Tony "working" on active task
    - Estimated completion time (based on complexity)
  - **Task States:**
    - 📋 Todo
    - 🏃 In Progress (Tony working on it)
    - ✅ Done
    - ❌ Blocked (needs input)
  - Drag-and-drop reordering
  - Quick actions (done, skip, reassign)

### 4. **Time Tracking Dashboard**
Visualization of Chris's tracked activities:

- **Data Source:** `~/clawd/timetracking/`
- **Views:**
  - **Today:** Current day breakdown with live updates
  - **Week:** 7-day view with daily totals
  - **Month:** Calendar heatmap
  - **Trends:** Charts showing:
    - Deep work hours over time
    - Break patterns
    - Most productive times of day
    - Category distribution (cyt, meet, gym, etc.)
- **Stats:**
  - Total deep work time
  - Break duration vs goal (max 1.5h)
  - Focus sessions count
  - Longest streak
- **Live Indicator:** Show current activity (from time-tracker-ping)

### 5. **Habits & Health**
Track routines and patterns:

- **Data Sources:** 
  - `~/clawd/workouts/` - Calisthenics logs
  - `~/clawd/memory/` - Reading logs, creatine reminders
- **Displays:**
  - Workout calendar (days trained vs rest)
  - Reading streak (days in a row)
  - Habit completion rates
  - Whoop data (when reconnected)
- **Quick Log:** Add workout or habit completion directly

### 6. **Memory Stream**
Recent activity and context:

- **Data Source:** `~/clawd/memory/YYYY-MM-DD.md`
- **Features:**
  - Timeline view of today's logged events
  - Search through memory files
  - Quick access to recent conversations
  - Filter by type (emails, coding, meetings)
  - Link to full memory file

### 7. **Communication Hub**
Direct interaction with Tony:

- **Chat Interface:**
  - Send messages to Tony's main session
  - View response stream in real-time
  - Message history
  - Quick commands (/status, /todos, /ideas)
- **Notifications:**
  - Important alerts from Tony
  - Completed tasks
  - Cron job summaries
  - System status changes

---

## 🔌 Data Flow & Integration

### Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│           Mission Control Dashboard             │
│         (Next.js + React + Tailwind)           │
└────────────┬────────────────────────┬───────────┘
             │                        │
             │ HTTP/SSE               │ WebSocket (future)
             │                        │
┌────────────▼────────────────────────▼───────────┐
│           Next.js API Routes                    │
│    - /api/status      - /api/ideas              │
│    - /api/todos       - /api/timetracking       │
│    - /api/sessions    - /api/chat               │
└────────┬─────────┬─────────┬──────────┬─────────┘
         │         │         │          │
         │         │         │          │
    ┌────▼───┐ ┌──▼───┐ ┌───▼────┐ ┌──▼─────────┐
    │ SQLite │ │ FS   │ │OpenClaw│ │  Process   │
    │   DB   │ │Watch │ │  API   │ │  Monitor   │
    └────────┘ └──┬───┘ └────────┘ └────────────┘
                  │
         ┌────────▼─────────┐
         │  ~/clawd/        │
         │  - ideas/        │
         │  - todos/        │
         │  - timetracking/ │
         │  - memory/       │
         │  - workouts/     │
         └──────────────────┘
```

### Data Synchronization Strategy

**1. Initial Load:**
- Dashboard loads → API reads all data files
- Parse JSON/JSONL/Markdown files
- Store in SQLite for faster queries
- Return aggregated data to frontend

**2. Real-Time Updates:**
- **File System Watchers:** Monitor `~/clawd/*` for changes
- On file change → Parse → Update SQLite → Broadcast SSE event
- Frontend receives event → React Query invalidates cache → Re-fetch

**3. OpenClaw Integration:**
- Poll `openclaw sessions list` every 30s (or use internal API if available)
- Parse session data (active agents, models, tokens)
- Expose via `/api/status` endpoint

**4. Task Assignment to Tony:**
- User creates task in dashboard
- API writes to `~/clawd/todos/tasks.jsonl`
- Send message to Tony's main session: `sessions_send(message: "New task assigned: [task]")`
- Tony picks up task, updates status
- Dashboard reflects change via file watcher

---

## 🎨 UI/UX Design

### Layout Structure

```
┌──────────────────────────────────────────────────┐
│  🎯 Mission Control | Tony & Chris              │  Header
├─────────┬────────────────────────────────────────┤
│         │                                        │
│ [Nav]   │   [Main Content Area]                  │
│         │                                        │
│ Status  │   Current View (Dashboard/Ideas/etc)  │
│ Ideas   │                                        │
│ Tasks   │   Real-time updates                    │
│ Time    │   Interactive components               │
│ Habits  │   Data visualizations                  │
│ Memory  │                                        │
│ Chat    │                                        │
│         │                                        │
│         │                                        │
├─────────┴────────────────────────────────────────┤
│  [Tony Avatar] [Status: Active] [2 sessions]    │  Footer/Status Bar
└──────────────────────────────────────────────────┘
```

### Dashboard (Home) View

```
┌─────────────────────────────────────────────────────┐
│  Tony's Status                                      │
│  ┌─────────────────────────────────────┐            │
│  │     🤖                              │            │
│  │   [Animated                         │            │
│  │    Avatar]    Working on:           │            │
│  │               Code review PR #595   │            │
│  │                                     │            │
│  │   Status: Active (2 sessions open) │            │
│  └─────────────────────────────────────┘            │
│                                                     │
│  Today's Focus              Quick Actions           │
│  ┌──────────────┐          ┌──────────────┐        │
│  │ 4.2h deep    │          │ [New Task]   │        │
│  │ work         │          │ [Add Idea]   │        │
│  │ 45m breaks   │          │ [Log Time]   │        │
│  └──────────────┘          └──────────────┘        │
│                                                     │
│  Recent Activity                                    │
│  ┌─────────────────────────────────────────┐       │
│  │ 08:30 - Started X Growth Block           │       │
│  │ 08:00 - Read + Coffee                    │       │
│  │ 07:00 - Morning brief sent               │       │
│  └─────────────────────────────────────────┘       │
│                                                     │
│  Active Tasks (3)          Ideas Queue (5)         │
│  ┌──────────────┐          ┌──────────────┐        │
│  │ [Task cards] │          │ [Idea cards] │        │
│  └──────────────┘          └──────────────┘        │
└─────────────────────────────────────────────────────┘
```

### Color Scheme
- **Primary:** Blue (#3B82F6) - Tech, trust, calm
- **Accent:** Green (#10B981) - Active, success
- **Warning:** Amber (#F59E0B) - Idle, attention
- **Error:** Red (#EF4444) - Busy, blocked
- **Dark Mode:** Default (Chris likely prefers dark UIs)

---

## 🚀 Deployment Plan

### Server Setup (srv1296870)

**1. Environment Setup:**
```bash
cd ~/dev/tony-mission-control
npm install
npm run build
```

**2. PM2 Configuration:**
```bash
pm2 start npm --name "mission-control" -- start
pm2 save
pm2 startup  # Enable auto-restart on reboot
```

**3. Nginx Reverse Proxy:**
```nginx
server {
    listen 80;
    server_name mission.cytsoftware.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # SSE endpoint
    location /api/stream {
        proxy_pass http://localhost:3000;
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding off;
        proxy_buffering off;
        proxy_cache off;
    }
}
```

**4. Environment Variables:**
```env
NODE_ENV=production
CLAWD_PATH=/home/clawdbot/clawd
PORT=3000
```

**5. Authentication:**
- Simple password protection (basic auth via Nginx)
- Or: Magic link login (email to Chris)
- Future: OAuth with Chris's Google account

---

## 📁 Project Structure

```
tony-mission-control/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Dashboard home
│   │   ├── ideas/              # Ideas hub page
│   │   ├── tasks/              # Task management page
│   │   ├── time/               # Time tracking page
│   │   ├── habits/             # Habits & health page
│   │   ├── memory/             # Memory stream page
│   │   ├── chat/               # Chat with Tony page
│   │   └── api/                # API routes
│   │       ├── status/route.ts
│   │       ├── ideas/route.ts
│   │       ├── todos/route.ts
│   │       ├── timetracking/route.ts
│   │       ├── sessions/route.ts
│   │       └── stream/route.ts  # SSE endpoint
│   ├── components/
│   │   ├── tony-avatar.tsx     # Animated avatar
│   │   ├── status-monitor.tsx
│   │   ├── task-card.tsx
│   │   ├── idea-card.tsx
│   │   ├── time-chart.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── data-parsers.ts     # Parse clawd files
│   │   ├── db.ts               # SQLite helpers
│   │   ├── file-watcher.ts     # FS watch logic
│   │   ├── openclaw.ts         # OpenClaw API client
│   │   └── utils.ts
│   └── types/
│       └── index.ts            # TypeScript types
├── public/
│   └── tony-avatar/            # Avatar SVG/animations
├── prisma/                     # (or SQL schema)
│   └── schema.prisma
├── .env.local
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
├── SPEC.md                     # This file
└── README.md
```

---

## 🔒 Security Considerations

1. **Authentication:** Dashboard protected with password/magic link
2. **No Public Access:** Only Chris can access (IP whitelist optional)
3. **Data Privacy:** All data stays on server, no external services
4. **File Permissions:** Dashboard runs as clawdbot user, has read access to ~/clawd
5. **HTTPS:** Let's Encrypt SSL cert for domain

---

## 🎯 Development Phases

### Phase 1: Foundation (Week 1)
- ✅ Create repo and structure
- ✅ Set up Next.js + TypeScript + Tailwind
- ✅ Create basic layout and navigation
- ✅ Build data parsers for ideas, todos, timetracking
- ✅ Set up SQLite database

### Phase 2: Core Features (Week 2)
- ✅ Agent Status Monitor with animated avatar
- ✅ Ideas Hub (view, search, filter)
- ✅ Task Management (create, assign, complete)
- ✅ Time Tracking Dashboard (charts, stats)

### Phase 3: Real-Time (Week 3)
- ✅ File system watchers
- ✅ SSE implementation for live updates
- ✅ OpenClaw session integration
- ✅ Chat interface with Tony

### Phase 4: Polish & Deploy (Week 4)
- ✅ Habits & Memory views
- ✅ UI refinements and animations
- ✅ Mobile responsive design
- ✅ Deploy to server with PM2 + Nginx
- ✅ Set up domain and SSL

---

## 🧪 Testing Strategy

- **Unit Tests:** Vitest for data parsers and utilities
- **Integration Tests:** API route testing
- **E2E Tests:** Playwright for critical user flows
- **Manual Testing:** Chris uses dashboard daily, reports issues

---

## 📈 Future Enhancements

1. **Voice Control:** "Hey Tony, show me today's tasks"
2. **Mobile App:** React Native companion app
3. **Notifications:** Push notifications for important events
4. **Analytics:** ML-powered insights on productivity patterns
5. **Multi-Agent Support:** If Tony spawns multiple personalities, track them all
6. **Calendar Integration:** Show Google Calendar events
7. **GitHub Integration:** Show commits, PRs, code reviews in activity feed
8. **Collaborative Tasks:** Share tasks with other humans (if Chris adds team members)

---

## 📝 Notes

- **Performance:** Optimize for fast load times (<1s initial load)
- **Data Volume:** Handle growing datasets (ideas, todos accumulate over time)
- **Reliability:** Dashboard should work even if OpenClaw is down (graceful degradation)
- **Maintainability:** Clean code, good documentation, easy for Chris to tweak

---

**Let's build something insane.** 🚀
