# Team Task Manager

A full-stack web app where users create projects, assign tasks, and track progress with **role-based access control** (global Admin/Member + per-project Owner/Member).

**Stack**: Express + MongoDB (Mongoose) + React (Vite) + Tailwind + JWT auth. Deployed as a single Railway service.

---

## ✨ Features

- 🔐 **Authentication** — signup/login with bcrypt + JWT
- 👥 **Role-based access control**
  - Global roles: `admin` (sees everything) / `member`
  - Per-project roles: `owner` (manages project + members) / `member` (participates)
- 📂 **Projects** — create, edit, delete, invite users, set roles
- ✅ **Tasks** — create, assign, set priority/status/due date, delete
- 📊 **Dashboard** — task counts by status, overdue tasks, recent activity, per-user stats
- 🧮 **Overdue logic** — `dueDate < now AND status != done`
- 🛡️ **Validation** — Zod schemas on every write endpoint
- 🌱 **Seed data** — 3 demo users, 2 projects, 10 tasks ready for demo
- 🚀 **One-service deployment** — Express serves the built React client

---

## 🗂 Repo Structure

```
ethara_project/
├── server/                 # Express API
│   ├── src/
│   │   ├── config/         # env, db connection
│   │   ├── models/         # User, Project, Task (Mongoose)
│   │   ├── middleware/     # auth, RBAC, validate, errors
│   │   ├── routes/         # auth, users, projects, tasks, dashboard
│   │   ├── controllers/    # business logic
│   │   ├── validators/     # Zod schemas
│   │   ├── utils/          # JWT, asyncHandler, ApiError
│   │   ├── scripts/seed.js # seed script
│   │   ├── app.js          # Express app (also serves client/dist)
│   │   └── index.js        # entrypoint
│   └── package.json
├── client/                 # React + Vite
│   ├── src/
│   │   ├── components/     # Layout, Modal, Badges, ProtectedRoute
│   │   ├── contexts/       # Auth, Toast
│   │   ├── pages/          # Login, Signup, Dashboard, Projects, ProjectDetail
│   │   ├── lib/            # api client, date helpers
│   │   └── App.jsx
│   └── package.json
├── package.json            # root — orchestrates build and start
├── railway.json            # Railway build/start config
└── README.md
```

---

## 🚀 Local Development

### Prerequisites

- **Node.js 18+**
- **MongoDB** — either local (`brew install mongodb-community`, `mongod`) or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env` — set `MONGODB_URI` and `JWT_SECRET` (any long random string).

### 3. Seed the database

```bash
npm run seed
```

This creates 3 demo users, 2 projects, and 10 tasks.

| Email             | Password  | Role   |
|-------------------|-----------|--------|
| `admin@demo.com`  | `admin123`| admin  |
| `alice@demo.com`  | `alice123`| member |
| `bob@demo.com`    | `bob123`  | member |

### 4. Run dev servers

```bash
npm run dev
```

- API: http://localhost:5000
- Client: http://localhost:5173 (proxies `/api/*` to the server)


---

## 🌐 Deploy to Railway

Railway runs the full stack as one web service. Express serves the built React app at `/` and the API at `/api/*`.

Required service variables:

| Variable        | Value                                           |
|-----------------|-------------------------------------------------|
| `MONGODB_URI`   | MongoDB connection string                       |
| `JWT_SECRET`    | Long random secret                              |
| `NODE_ENV`      | `production`                                    |
| `CLIENT_ORIGIN` | `*` or the generated Railway app domain         |

Railway uses `railway.json` to run `npm run build` during build and `npm start` at deploy time.


---

## 🧪 API Reference

All API routes are under `/api`. Authenticated routes require `Authorization: Bearer <jwt>` header.

### Auth

| Method | Route              | Body                                   | Description          |
|--------|--------------------|----------------------------------------|----------------------|
| POST   | `/api/auth/signup` | `{ name, email, password, role? }`     | Register + get JWT   |
| POST   | `/api/auth/login`  | `{ email, password }`                  | Login + get JWT      |
| GET    | `/api/auth/me`     | —                                      | Current user         |

### Users

| Method | Route               | Description                     |
|--------|---------------------|---------------------------------|
| GET    | `/api/users?q=foo`  | Search users (for adding to projects) |

### Projects

| Method | Route                                   | RBAC                                 |
|--------|-----------------------------------------|--------------------------------------|
| GET    | `/api/projects`                         | lists visible projects (admin sees all) |
| POST   | `/api/projects`                         | any authenticated user               |
| GET    | `/api/projects/:id`                     | project participant OR admin         |
| PATCH  | `/api/projects/:id`                     | project owner OR admin               |
| DELETE | `/api/projects/:id`                     | project owner OR admin               |
| POST   | `/api/projects/:id/members`             | project owner OR admin               |
| PATCH  | `/api/projects/:id/members/:userId`     | project owner OR admin               |
| DELETE | `/api/projects/:id/members/:userId`     | project owner OR admin               |

### Tasks (nested under project)

| Method | Route                                           | RBAC                                                |
|--------|-------------------------------------------------|-----------------------------------------------------|
| GET    | `/api/projects/:projectId/tasks`                | project participant OR admin                        |
| POST   | `/api/projects/:projectId/tasks`                | project participant OR admin                        |
| GET    | `/api/projects/:projectId/tasks/:taskId`        | project participant OR admin                        |
| PATCH  | `/api/projects/:projectId/tasks/:taskId`        | creator, project owner, admin (any field) · assignee (status only) |
| DELETE | `/api/projects/:projectId/tasks/:taskId`        | creator, project owner, admin                       |

Query params on list: `?status=todo&assignee=<userId>&overdue=true`

### Dashboard

| Method | Route             | Description                         |
|--------|-------------------|-------------------------------------|
| GET    | `/api/dashboard`  | Totals, status counts, overdue list, recent activity |

### Health

| Method | Route             |
|--------|-------------------|
| GET    | `/api/health`     |

---

## 🔐 RBAC Summary

**Two layers**:

1. **Global role** on `User.role` — `admin` or `member`.
   - `admin` bypasses all per-project checks (sees + edits everything).

2. **Per-project role** inside `Project.members[].role` — `owner` or `member`.
   - `owner` can edit the project, manage members, delete the project, delete any task in the project.
   - `member` can see the project, create tasks, edit their own tasks, change status of tasks assigned to them.

**Task-level edit matrix** (non-admins):

| Action              | Creator | Project owner | Assignee | Other members |
|---------------------|:-------:|:-------------:|:--------:|:-------------:|
| View                |   ✅    |      ✅       |    ✅    |      ✅       |
| Edit any field      |   ✅    |      ✅       |    ❌    |      ❌       |
| Change status only  |   ✅    |      ✅       |    ✅    |      ❌       |
| Delete              |   ✅    |      ✅       |    ❌    |      ❌       |

---

## 🧱 Data Model

```
User { name, email (unique), passwordHash, role: 'admin' | 'member' }

Project {
  name, description,
  owner: ref User,
  members: [{ user: ref User, role: 'owner' | 'member' }]
}

Task {
  title, description,
  project: ref Project,
  assignee: ref User | null,
  createdBy: ref User,
  status: 'todo' | 'in_progress' | 'done',
  priority: 'low' | 'medium' | 'high',
  dueDate: Date | null
}
```

**Overdue** is computed (not stored): `dueDate < now AND status !== 'done'`.

---

## 🛠 Scripts

| Command              | What it does                                      |
|----------------------|---------------------------------------------------|
| `npm run install:all`| Install root + server + client deps               |
| `npm run dev`        | Run server (5000) + client (5173) in parallel     |
| `npm run dev:server` | Server only                                       |
| `npm run dev:client` | Client only                                       |
| `npm run seed`       | Reset DB and load demo data                       |
| `npm run build`      | Build the client for production                   |
| `npm start`          | Start the production server                       |

---

## 📝 Notes

- **CORS**: in production the client is served same-origin from Express, so CORS is effectively a no-op. `CLIENT_ORIGIN=*` is safe.
- **Rate limiting**: auth endpoints are capped at 100 requests / 15 min per IP.
- **Password hashing**: bcrypt, 10 rounds.
- **JWT expiration**: 7 days (configurable via `JWT_EXPIRES_IN`).
