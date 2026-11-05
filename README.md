# 💰 Expense Tracker (MERN)

A full-stack personal finance app — record income & expenses, organize by category, set monthly
budgets, and see where your money goes through summaries and charts.

**Stack:** MongoDB · Express · Node.js · React (TypeScript + Vite + Tailwind CSS 4 + Recharts)

## Features

- **Auth** — register / login / logout, JWT (`Authorization: Bearer`), persistent session
- **Transactions** — full CRUD, filter by type / category / date range, search by note,
  sort, pagination
- **Categories** — shared defaults (auto-seeded) + custom categories with icon & color
- **Dashboard** — income / expense / balance summary cards, recent list, pie & bar charts
- **Budgets** — monthly per-category limits with progress bars and over-budget warnings
- **Reports** — expense breakdown per month, income vs. expense trend per year
- **Profile** — update name, currency (26 options), change password
- **Security** — bcrypt hashing, input validation, rate limiting, helmet, CORS, mongo-sanitize
- Apple-style light UI: system fonts, translucent nav, subtle motion, reduced-motion support,
  responsive from mobile (bottom tab bar) to desktop (sidebar)

## Project structure

Backend code lives under `server/src/` (app + all folders), with `package.json` and `.env` at
the `server/` root — a clean code/config split. This mirrors the folder structure in the design
doc (§7), plus a few solid additions (marked `(+)`) such as `validators/`, `rateLimiter.js`,
and client `types/`.

```
expense-tracker/
├── README.md
├── .gitignore
├── server/                              # Express REST API
│   ├── src/                             # (+) all backend code lives under src/
│   │   ├── config/
│   │   │   └── db.js                    # Mongoose connection
│   │   ├── controllers/
│   │   │   ├── authController.js        # register / login / me / profile / password
│   │   │   ├── transactionController.js # CRUD + filters + pagination
│   │   │   ├── categoryController.js    # defaults + custom CRUD (usage counts)
│   │   │   ├── budgetController.js      # monthly upsert + spent aggregation
│   │   │   └── statsController.js       # summary / by-category / monthly
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js        # JWT verify → req.user
│   │   │   ├── errorMiddleware.js       # 404 + centralized error handler
│   │   │   ├── validate.js              # express-validator result runner
│   │   │   └── rateLimiter.js           # (+) global + auth limiters
│   │   ├── models/
│   │   │   ├── User.js                  # hashed password, toJSON strip
│   │   │   ├── Category.js              # user: null = shared default
│   │   │   ├── Transaction.js           # indexes {user+date}, {user+category}
│   │   │   └── Budget.js                # unique (user, category, month)
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── transactionRoutes.js
│   │   │   ├── categoryRoutes.js
│   │   │   ├── budgetRoutes.js
│   │   │   └── statsRoutes.js
│   │   ├── validators/                  # (+) express-validator chains
│   │   │   ├── authValidators.js
│   │   │   ├── transactionValidators.js
│   │   │   ├── categoryValidators.js
│   │   │   ├── budgetValidators.js
│   │   │   └── statsValidators.js
│   │   ├── utils/
│   │   │   ├── generateToken.js
│   │   │   ├── asyncHandler.js          # (+) async error forwarding
│   │   │   ├── dates.js                 # (+) YYYY-MM-DD / month / year helpers
│   │   │   └── defaultCategories.js     # (+) idempotent seed (runs on boot)
│   │   ├── app.js                       # express wiring: helmet, cors, sanitize, routes
│   │   └── server.js                    # entry: connectDB → seed → listen
│   ├── package.json                     # scripts point at src/server.js
│   ├── .env.example
│   └── .env                             # gitignored
└── client/                              # React SPA (TypeScript)
    ├── index.html
    ├── vite.config.ts                   # react + tailwindcss plugins, @ alias
    ├── tsconfig.json
    ├── package.json
    ├── .env                             # VITE_API_URL (gitignored)
    └── src/
        ├── main.tsx                     # root render + <Toaster>
        ├── App.tsx                      # all routes
        ├── index.css                    # design tokens (Tailwind v4 @theme)
        ├── vite-env.d.ts
        ├── api/
        │   ├── client.ts                # axios + token/401 interceptors
        │   ├── auth.ts
        │   ├── transactions.ts
        │   ├── categories.ts
        │   ├── stats.ts
        │   └── budgets.ts
        ├── components/
        │   ├── icons.tsx                # (+) single 1.7px-stroke SVG icon set
        │   ├── layout/
        │   │   └── AppLayout.tsx        # sidebar + top bar + bottom tab bar
        │   ├── ui/
        │   │   ├── Button.tsx           # Button + IconButton
        │   │   ├── Input.tsx            # Input + Select (label/error/hint)
        │   │   ├── Modal.tsx            # bottom sheet ↔ centered dialog
        │   │   ├── Loader.tsx           # Loader / FullPageLoader / Skeleton
        │   │   ├── EmptyState.tsx
        │   │   ├── ConfirmDialog.tsx
        │   │   └── Pagination.tsx
        │   ├── charts/
        │   │   ├── ExpensePieChart.tsx  # donut by category
        │   │   └── MonthlyBarChart.tsx  # income vs. expense per month
        │   └── transactions/
        │       ├── TransactionForm.tsx  # create/edit modal form
        │       ├── FilterBar.tsx        # search + filters + clear
        │       └── TransactionList.tsx  # table (desktop) / cards (mobile)
        ├── context/
        │   └── AuthContext.tsx          # user, token, login/register/logout, useAuth
        ├── hooks/
        │   ├── useTransactions.ts       # filter-aware list + refetch
        │   ├── useCategories.ts         # request-cached categories + refresh
        │   └── useDebounce.ts
        ├── pages/
        │   ├── Login.tsx
        │   ├── Register.tsx
        │   ├── Dashboard.tsx
        │   ├── Transactions.tsx
        │   ├── Categories.tsx
        │   ├── Budgets.tsx
        │   ├── Reports.tsx
        │   ├── Profile.tsx
        │   └── NotFound.tsx
        ├── routes/
        │   ├── ProtectedRoute.tsx       # redirect to /login with `from` state
        │   └── PublicRoute.tsx
        ├── types/
        │   └── index.ts                 # User, Category, Transaction, Budget, …
        └── utils/
            ├── format.ts                # currency/date formatters + cn helper
            └── constants.ts             # palettes, currency list
```

## Quick start

### 1. Backend

```bash
cd server
npm install
# configure your environment (MongoDB URI + JWT secret)
copy .env.example .env   # then edit .env
npm run dev              # → http://localhost:5000
```

`server/.env` needs:

| Variable       | Example                                        |
| -------------- | ---------------------------------------------- |
| `PORT`         | `5000`                                         |
| `MONGO_URI`    | `mongodb://127.0.0.1:27017/expense-tracker`    |
| `JWT_SECRET`   | a long random string                           |
| `JWT_EXPIRES_IN` | `7d`                                         |
| `CLIENT_URL`   | `http://localhost:5173`                        |

Default categories are seeded automatically on first boot.

### 2. Frontend

```bash
cd client
npm install
npm run dev              # → http://localhost:5173
```

`client/.env`: `VITE_API_URL=http://localhost:5000/api`

## API overview (base `/api`)

| Area         | Endpoints                                                          |
| ------------ | ------------------------------------------------------------------ |
| Auth         | `POST /auth/register` · `POST /auth/login` · `GET /auth/me` · `PUT /auth/profile` · `PUT /auth/password` |
| Transactions | `GET/POST /transactions` · `GET/PUT/DELETE /transactions/:id`      |
| Categories   | `GET/POST /categories` · `PUT/DELETE /categories/:id`              |
| Budgets      | `GET/POST /budgets` · `PUT/DELETE /budgets/:id`                    |
| Stats        | `GET /stats/summary` · `GET /stats/by-category` · `GET /stats/monthly` |

All list endpoints support query params (`type`, `category`, `startDate`, `endDate`, `search`,
`sort`, `page`, `limit`). Dates are `YYYY-MM-DD`, months are `YYYY-MM`.

Response envelope: `{ "success": true, "data": …, "pagination": … }` — errors always arrive as
`{ "success": false, "message": …, "errors": [{ field, msg }] }`.

## Notes

- Transaction dates are stored at UTC midnight and displayed in UTC — a date is a date, not a
  timestamp, so grouping never shifts.
- The token lives in `localStorage` (kept simple per the MVP spec; switch to httpOnly cookies for
  production-grade XSS resistance).
- `POST /budgets` is an upsert on (user, category, month).

## Roadmap (Phase 2 ideas)

Recurring transactions · CSV export · dark mode · receipt uploads · email/password reset ·
multi-currency · shared/group expenses · PWA.

---

Author: Aashish — built with the MERN stack.
