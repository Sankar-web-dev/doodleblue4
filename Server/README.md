# DoodleBlue API

NestJS backend for the DoodleBlue admin console — user, role & permission management.

## Stack

- NestJS 12 (Express platform)
- PostgreSQL + Prisma 7 (driver adapter `pg`)
- Session-cookie auth (`app.sid`, opaque tokens stored in the `Session` table)
- bcryptjs password hashing, Resend for invite emails

## Setup

```bash
cp .env.example .env   # fill in DATABASE_URL etc.
pnpm install
pnpm prisma db push    # create tables
pnpm seed              # create the SUPER_ADMIN account
pnpm start:dev         # http://localhost:5000
```

## API

All routes are under `/api/v1` and return `{ success, data, meta?, error? }` envelopes.

| Route                                    | Description                          |
| ---------------------------------------- | ------------------------------------ |
| `POST /api/v1/auth/login`                | Sign in — sets `app.sid` cookie      |
| `POST /api/v1/auth/register`             | Self-signup — auto-logs in           |
| `GET  /api/v1/auth/signup-roles`         | Active roles for the signup form     |
| `POST /api/v1/auth/logout`               | Sign out — destroys session          |
| `GET  /api/v1/auth/me`                   | Current user + role permissions      |
| `PATCH /api/v1/auth/change-password`     | Change own password                  |
| `GET|POST /api/v1/users`                 | List / provision users               |
| `GET /api/v1/users/options`              | Lightweight picker list              |
| `POST /api/v1/users/upload-avatar`       | Avatar upload (`/api/v1/storage/:id`)|
| `GET|PATCH|DELETE /api/v1/users/:id`     | User detail / update / delete        |
| `GET|POST /api/v1/roles`                 | List / create roles (permission matrix) |
| `GET|PATCH|DELETE /api/v1/roles/:id`     | Role detail / update / delete        |
| `GET /api/v1/health`                     | Health check                         |

## RBAC

`SUPER_ADMIN` is a hardcoded system account (created via `pnpm seed`) with implicit
access to everything. All other users reference a `Role` row whose `permissions`
matrix (`[{ resource, actions }]`, resources: `roles`, `users`; actions:
`create`, `read`, `update`, `delete`) gates every endpoint.
