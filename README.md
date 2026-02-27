# Tony Mission Control 🚀

**Real-time mission control dashboard for Tony AI and Chris.**

A comprehensive dashboard that provides complete visibility into AI agent operations, tasks, data, and communication. Think NASA mission control meets modern task management.

![Mission Control Dashboard](https://img.shields.io/badge/Next.js-14-black?logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript) ![License](https://img.shields.io/badge/license-MIT-green)

---

## 🎯 What This Is

Mission Control is the central hub for monitoring and managing the Tony AI assistant and Chris's productivity data. It integrates with all data sources in `~/clawd/` to provide:

- **Real-time agent status** - See what Tony is working on right now
- **Ideas hub** - Capture and organize product ideas
- **Task management** - Full todo system with tags, priorities, due dates
- **Time tracking** - Visualize productivity with charts and insights
- **Habits & health** - Workout logs and Whoop recovery data
- **Memory stream** - Browse daily activity logs
- **Chat interface** - Direct communication with Tony via commands

---

## ✨ Features

### 🤖 Agent Status Monitor
- **Animated Avatar** - Visual representation of Tony's state (Active/Idle/Busy/Sleeping)
- **Current Activity** - What Tony is working on right now
- **Session Info** - Active OpenClaw sessions, model, tokens, runtime
- **Background Tasks** - Sub-agents, cron jobs, tmux sessions

### 💡 Ideas Hub
- Grid/list view of all captured ideas
- Search and filter by tags
- Status tracking (new, in-progress, implemented)
- Add new ideas directly from the dashboard
- Export to markdown

### ✅ Task Management
- Create tasks with tags, priorities, due dates
- Assign to Tony or Chris
- Track task states (todo, in-progress, done, blocked)
- Tony's work queue visualization
- Quick actions (done, skip, reassign)

### ⏱️ Time Tracking Dashboard
- **Today View** - Timeline with hour-by-hour breakdown
- **Week View** - Stacked bar charts with category colors
- **Month View** - GitHub-style heatmap calendar
- **Trends** - Deep work hours, category distribution over time
- **Stats** - Total deep work, breaks, focus sessions, streaks

### 💪 Habits & Health
- Workout calendar with exercise details
- Whoop integration (recovery, strain, sleep scores)
- Habit streak visualization
- Quick logging interface

### 📝 Memory Stream
- Timeline view of daily logs
- Search through memory files
- Expandable entries with markdown rendering
- Filter by content type

### 💬 Chat Interface
- Send messages to Tony's main session
- Quick commands: `/status`, `/todos`, `/ideas`, `/time`
- Message history
- Real-time responses

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 3
- **UI Components:** shadcn/ui (Radix UI primitives)
- **Database:** SQLite + Drizzle ORM
- **Charts:** Recharts
- **Animation:** Framer Motion
- **State Management:** TanStack Query (React Query)
- **Real-time:** Server-Sent Events (SSE)
- **File Watching:** chokidar
- **Deployment:** PM2 + Nginx

---

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Access to `~/clawd/` data directories

### Setup

```bash
# Clone the repository
git clone https://github.com/tony-c3a/tony-mission-control.git
cd tony-mission-control

# Install dependencies
npm install

# Sync data from ~/clawd/ to SQLite
npm run sync

# Start development server
npm run dev
```

The dashboard will be available at **http://localhost:3000**

---

## 📁 Project Structure

```
tony-mission-control/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Dashboard home
│   │   ├── ideas/              # Ideas hub
│   │   ├── tasks/              # Task management
│   │   ├── time/               # Time tracking
│   │   ├── habits/             # Habits & health
│   │   ├── memory/             # Memory stream
│   │   ├── chat/               # Chat interface
│   │   └── api/                # API routes
│   ├── components/             # React components
│   │   ├── sidebar.tsx         # Navigation sidebar
│   │   ├── tony-avatar.tsx     # Animated Tony avatar
│   │   └── ui/                 # shadcn/ui components
│   ├── lib/                    # Utilities and core logic
│   │   ├── db/                 # Database schema & queries
│   │   ├── parsers/            # Data file parsers
│   │   └── file-watcher.ts     # Real-time file monitoring
│   └── hooks/                  # Custom React hooks
├── scripts/
│   └── sync.ts                 # Data sync script
├── drizzle.config.ts           # Drizzle ORM config
├── ecosystem.config.js         # PM2 deployment config
└── package.json
```

---

## 🔄 Data Sources

Mission Control integrates with these data directories in `~/clawd/`:

| Source | Path | Format | Purpose |
|--------|------|--------|---------|
| **Time Tracking** | `~/clawd/timetracking/entries/*.json` | JSON | Activity logs with timestamps, categories |
| **Ideas** | `~/clawd/ideas/ideas.json(l)` | JSON/JSONL | Product ideas with tags, context |
| **Todos** | `~/clawd/todos/*.md` | Markdown | Tasks (inbox, active, completed, someday) |
| **Workouts** | `~/clawd/workouts/*.json` | JSON | Exercise logs with sets, reps, weight |
| **Memory** | `~/clawd/memory/YYYY-MM-DD.md` | Markdown | Daily activity logs |
| **Whoop** | `~/clawd/whoop/*.json` | JSON | Recovery, strain, sleep data |

---

## 🚀 Development

### Available Scripts

```bash
# Start development server (localhost:3000)
npm run dev

# Sync data from ~/clawd/ to SQLite cache
npm run sync

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

### Real-Time Updates

The dashboard uses **Server-Sent Events (SSE)** and **file watchers** to provide real-time updates:

1. **File Watcher** monitors `~/clawd/` directories for changes
2. **Event Bus** broadcasts change events via SSE
3. **React Query** invalidates caches and refetches data
4. **UI updates automatically** without page refresh

---

## 🌐 Production Deployment

### Using PM2 (Recommended)

An `ecosystem.config.js` is included for PM2 deployment:

```bash
# Build the application
npm run build

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Enable PM2 startup on reboot
pm2 startup
```

### Nginx Reverse Proxy

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name mission.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # SSE endpoint (disable buffering)
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

### Environment Variables

Create `.env.local` for configuration:

```env
# Server port (default: 3000)
PORT=3000

# Path to clawd workspace
CLAWD_PATH=/home/clawdbot/clawd

# Database path (default: ./data/mission-control.db)
DATABASE_PATH=./data/mission-control.db

# Optional: Authentication token
DASHBOARD_TOKEN=your-secret-token
```

---

## 📊 API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | Tony's current status and session info |
| `/api/ideas` | GET | Retrieve all ideas |
| `/api/ideas` | POST | Create a new idea |
| `/api/todos` | GET | Retrieve todos (filter by source, status) |
| `/api/todos` | POST | Create a new todo |
| `/api/timetracking` | GET | Time entries (filter by date range) |
| `/api/timetracking/stats` | GET | Aggregate time tracking statistics |
| `/api/memory` | GET | Daily memory logs |
| `/api/workouts` | GET | Workout history |
| `/api/stream` | GET | SSE event stream for real-time updates |

---

## 🎨 Customization

### Theme Colors

Edit `src/app/globals.css` to customize the color scheme:

```css
@layer base {
  :root {
    --primary: /* your color */;
    --accent: /* your color */;
  }
}
```

### Tony Avatar States

Customize avatar animations in `src/components/tony-avatar.tsx`:
- 🟢 **Active** - Working on tasks
- 🟡 **Idle** - Waiting for input
- 🔴 **Busy** - Multiple sessions running
- 💤 **Sleeping** - Off-hours

---

## 🐛 Troubleshooting

### Data not showing up?

Run the sync script to populate the SQLite cache:
```bash
npm run sync
```

### Real-time updates not working?

Check that the file watcher has permissions to monitor `~/clawd/`:
```bash
# Verify clawd path
ls -la ~/clawd/
```

### Build errors?

Clear cache and reinstall:
```bash
rm -rf .next node_modules
npm install
npm run build
```

---

## 📝 Development Notes

### Adding New Data Sources

1. Create parser in `src/lib/parsers/your-source.ts`
2. Add schema to `src/lib/db/schema.ts`
3. Update sync script in `scripts/sync.ts`
4. Create API route in `src/app/api/your-source/route.ts`
5. Build UI page in `src/app/your-source/page.tsx`

### Database Migrations

Using Drizzle ORM:

```bash
# Generate migration
npx drizzle-kit generate

# Apply migration
npx drizzle-kit migrate
```

---

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Inspired by mission control dashboards everywhere

---

**Built by Tony AI with Claude Code** • [GitHub](https://github.com/tony-c3a/tony-mission-control)
