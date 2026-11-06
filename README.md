# 💰 Expense Tracker (MERN)

A full-stack personal finance app — record income & expenses, organize by category, set monthly
budgets, split shared costs with friends, and see where your money goes through summaries and
charts. Installable as a PWA.

**Stack:** MongoDB · Express + TypeScript (Node.js) · React (TypeScript + Vite + Tailwind CSS 4 + Recharts + lucide-react)

## Features

- **Auth** — register / login / logout, JWT (`Authorization: Bearer`), persistent session
- **Transactions** — full CRUD, filter by type / category / date range, search by note,
  sort, pagination
- **Categories** — shared defaults (auto-seeded) + custom categories with a minimal lucide icon
  (34-option picker) & color
- **Dashboard** — income / expense / balance summary cards, recent list, pie & bar charts
- **Budgets** — monthly per-category limits with progress bars and over-budget warnings
- **Reports** — expense breakdown per month, income vs. expense trend per year
- **Profile** — update name, currency (26 options), change password
- **Dark mode** — token-level theming (light/dark), follows system preference on first visit,
  pre-paint restore with no flash, theme-aware charts and navigational chrome
- **CSV export** — download all transactions or the currently filtered set as an Excel-friendly
  UTF-8 CSV from the Transactions page
- **Recurring transactions** — daily / weekly / monthly rules that log entries automatically,
  even when the app is closed (a boot + 10-minute sweep materializes due occurrences with catch-up)
- **Multi-currency** — display every amount in any of the 26 supported currencies, converted at
  render time from the NPR base using a clearly-dated static rate snapshot
- **Password reset** — "Forgot password?" flow; 15-minute, single-use, SHA-256-hashed reset
  tokens (the reply never reveals whether an email is registered)
- **Receipt uploads** — attach a photo/PDF (JPG · PNG · WebP · PDF, ≤ 5 MB) to any transaction and
  view it in-app; group members can open the receipts of shared expenses too
- **Shared group expenses** — groups of up to 12 members log shared expenses that are split
  equally; live per-member balances and a "who pays whom" settle-up plan
- **PWA** — installable app: service worker + web manifest, offline-ready app shell; API responses
  are deliberately never cached
- **Security** — bcrypt hashing, input validation, rate limiting, helmet, CORS, mongo-sanitize
- Apple-style light & dark UI in a wine red & light sand palette (accent `#7f011f`, canvas
  `#f5ebd0`): system fonts, translucent nav, subtle motion, reduced-motion support, responsive
  from mobile (bottom tab bar) to desktop (sidebar)

## Project structure

Backend code lives under `server/src/` and is written in **TypeScript** (strict mode), matching
the frontend — a fully consistent stack. `package.json` and `.env` stay at the `server/` root — a
clean code/config split. This mirrors the folder structure in the design doc (§7), plus a few
solid additions (marked `(+)`) such as `validators/`, `rateLimiter.js`, and client `types/`.

```
expense-tracker/
├── README.md
├── .gitignore
├── server/                              # Express REST API (TypeScript)
│   ├── src/                             # (+) all backend code lives under src/
│   │   ├── config/
│   │   │   └── db.ts                    # Mongoose connection
│   │   ├── controllers/
│   │   │   ├── authController.ts        # register / login / me / profile / password / reset flows
│   │   │   ├── transactionController.ts # CRUD + filters + pagination + receipt upload/download
│   │   │   ├── categoryController.ts    # defaults + custom CRUD (usage counts)
│   │   │   ├── budgetController.ts      # monthly upsert + spent aggregation
│   │   │   ├── recurringController.ts   # recurring rules: CRUD + due materialization
│   │   │   ├── groupController.ts       # (+) groups: CRUD + members + stats + shared feed
│   │   │   └── statsController.ts       # summary / by-category / monthly
│   │   ├── middleware/
│   │   │   ├── authMiddleware.ts        # JWT verify → req.user
│   │   │   ├── errorMiddleware.ts       # 404 + centralized error handler
│   │   │   ├── validate.ts              # express-validator result runner
│   │   │   ├── rateLimiter.ts           # (+) global + auth limiters
│   │   │   └── receiptUpload.ts         # (+) multer disk storage (5 MB · jpg/png/webp/pdf)
│   │   ├── models/
│   │   │   ├── User.ts                  # hashed password, toJSON strip (reset fields hidden)
│   │   │   ├── Category.ts              # user: null = shared default
│   │   │   ├── Transaction.ts           # + receipt/group fields · unique partial dedupe index
│   │   │   ├── Budget.ts                # unique (user, category, month)
│   │   │   ├── Recurring.ts             # daily/weekly/monthly templates
│   │   │   └── Group.ts                 # (+) permanent members (1-12), owner role
│   │   ├── routes/
│   │   │   ├── authRoutes.ts
│   │   │   ├── transactionRoutes.ts
│   │   │   ├── categoryRoutes.ts
│   │   │   ├── budgetRoutes.ts
│   │   │   ├── recurringRoutes.ts
│   │   │   ├── groupRoutes.ts
│   │   │   └── statsRoutes.ts
│   │   ├── validators/                  # (+) express-validator chains
│   │   │   ├── authValidators.ts
│   │   │   ├── transactionValidators.ts
│   │   │   ├── categoryValidators.ts
│   │   │   ├── budgetValidators.ts
│   │   │   ├── recurringValidators.ts
│   │   │   ├── groupValidators.ts
│   │   │   └── statsValidators.ts
│   │   ├── types/
│   │   │   └── express.d.ts             # (+) typed req.user via declaration merging
│   │   ├── utils/
│   │   │   ├── generateToken.ts
│   │   │   ├── asyncHandler.ts          # (+) async error forwarding
│   │   │   ├── dates.ts                 # (+) YYYY-MM-DD / month / year helpers
│   │   │   ├── recurrence.ts            # (+) occurrence math + due sweep
│   │   │   ├── groups.ts                # (+) member resolution + greedy settle-up plan
│   │   │   ├── receipts.ts              # (+) uploads dir + safe unlink helpers
│   │   │   ├── mailer.ts                # (+) dev mail stub (console + .mail-outbox.txt)
│   │   │   └── defaultCategories.ts     # (+) idempotent seed (runs on boot; also refreshes defaults' icon/color)
│   │   ├── app.ts                       # express wiring: helmet, cors, sanitize, routes
│   │   └── server.ts                    # entry: connectDB → seed → recurring sweep → listen
│   ├── tsconfig.json                    # strict TS, CommonJS output → dist/
│   ├── package.json                     # dev: tsx watch · build: tsc · start: node dist
│   ├── .env.example
│   └── .env                             # gitignored
└── client/                              # React SPA (TypeScript)
    ├── index.html                       # PWA meta: manifest link, apple-touch-icon
    ├── vite.config.ts                   # react + tailwindcss plugins, @ alias, PWA plugin (manifest + SW)
    ├── tsconfig.json
    ├── package.json
    ├── .env                             # VITE_API_URL (gitignored)
    ├── public/
    │   └── icons/                       # PWA app icons (192 / 512 / maskable-512)
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
        │   ├── budgets.ts
        │   ├── recurring.ts             # (+) recurring rules API
        │   └── groups.ts                # (+) groups API (+ receipt helpers in transactions.ts)
        ├── components/
        │   ├── categories/
        │   │   └── categoryIcons.tsx    # (+) curated lucide set + CategoryIconChip / picker options
        │   ├── layout/
        │   │   └── AppLayout.tsx        # sidebar + top bar + bottom tab bar
        │   ├── ui/
        │   │   ├── Button.tsx           # Button + IconButton
        │   │   ├── Input.tsx            # Input + Select (label/error/hint)
        │   │   ├── Modal.tsx            # bottom sheet ↔ centered dialog
        │   │   ├── Loader.tsx           # Loader / FullPageLoader / Skeleton
        │   │   ├── EmptyState.tsx
        │   │   ├── ConfirmDialog.tsx
        │   │   ├── RateNote.tsx            # (+) conversion-snapshot notice
        │   │   └── Pagination.tsx
        │   ├── charts/
        │   │   ├── ExpensePieChart.tsx  # donut by category
        │   │   └── MonthlyBarChart.tsx  # income vs. expense per month
        │   ├── transactions/
        │       ├── TransactionForm.tsx  # create/edit modal form (+ receipt attach/remove/view)
        │       ├── FilterBar.tsx        # search + filters + clear
        │       ├── ReceiptViewer.tsx    # (+) in-app receipt preview (blob object URL)
        │       └── TransactionList.tsx  # table (desktop) / cards (mobile) + receipt badges
        │   └── recurring/
        │       └── RecurringForm.tsx    # (+) rule create/edit modal
        ├── context/
        │   └── AuthContext.tsx          # user, token, login/register/logout, useAuth
        ├── hooks/
        │   ├── useTransactions.ts       # filter-aware list + refetch
        │   ├── useCategories.ts         # request-cached categories + refresh
        │   └── useDebounce.ts
        ├── pages/
        │   ├── Login.tsx
        │   ├── Register.tsx
        │   ├── ForgotPassword.tsx       # (+) request a reset link
        │   ├── ResetPassword.tsx        # (+) set a new password (token via query param)
        │   ├── Dashboard.tsx
        │   ├── Transactions.tsx
        │   ├── Categories.tsx
        │   ├── Budgets.tsx
        │   ├── Recurring.tsx
        │   ├── Groups.tsx               # (+) group list + group detail / balances / settle-up
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
            ├── theme.ts                 # (+) light/dark store + useTheme
            ├── chartTheme.ts            # (+) SVG-safe themed chart colors
            ├── currency.ts              # (+) NPR-base rate snapshot + converter
            └── constants.ts             # palettes, currency list
```

## Quick start

### 1. Backend

```bash
cd server
npm install
# configure your environment (MongoDB URI + JWT secret)
copy .env.example .env   # then edit .env
npm run dev              # → http://localhost:5000 (tsx watch, hot reload)
npm run typecheck        # strict TypeScript check
npm run build            # compile to dist/
npm start                # run the compiled build (node dist/server.js)
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
| Auth         | `POST /auth/register` · `POST /auth/login` · `GET /auth/me` · `PUT /auth/profile` · `PUT /auth/password` · `POST /auth/forgot-password` · `POST /auth/reset-password` |
| Transactions | `GET/POST /transactions` · `GET/PUT/DELETE /transactions/:id` · `GET /transactions/export` (CSV) · `GET/POST/DELETE /transactions/:id/receipt` |
| Categories   | `GET/POST /categories` · `PUT/DELETE /categories/:id`              |
| Budgets      | `GET/POST /budgets` · `PUT/DELETE /budgets/:id`                    |
| Recurring    | `GET/POST /recurring` · `PUT/DELETE /recurring/:id`                |
| Groups       | `GET/POST /groups` · `GET/PUT/DELETE /groups/:id` · `GET /groups/:id/stats` · `GET /groups/:id/transactions` · `POST /groups/:id/members` |
| Stats        | `GET /stats/summary` · `GET /stats/by-category` · `GET /stats/monthly` |

All list endpoints support query params (`type`, `category`, `startDate`, `endDate`, `search`,
`sort`, `page`, `limit`). Dates are `YYYY-MM-DD`, months are `YYYY-MM`.

Response envelope: `{ "success": true, "data": …, "pagination": … }` — errors always arrive as
`{ "success": false, "message": …, "errors": [{ field, msg }] }`.

## Notes

- Category icons are stored as kebab-case lucide names (`utensils`, `briefcase`), not emoji —
  rendering is centralized in `components/categories/categoryIcons.tsx`, whose chip falls back to
  a Tag glyph when unset and still renders plain emoji for categories created before the switch.

- Transaction dates are stored at UTC midnight and displayed in UTC — a date is a date, not a
  timestamp, so grouping never shifts.
- The token lives in `localStorage` (kept simple per the MVP spec; switch to httpOnly cookies for
  production-grade XSS resistance).
- `POST /budgets` is an upsert on (user, category, month).
- Amounts are stored in the NPR base. Display conversion uses the static snapshot in
  `client/src/utils/currency.ts` (see `RATE_DATE`) — no runtime API. The CSV export always
  contains base-NPR amounts.
- Recurring rules are materialized by a boot-time + 10-minute sweep (`utils/recurrence.ts`).
  Missed occurrences are backfilled on their own dates; a monthly rule on the 31st clamps to
  shorter months (Feb 28/29). Deleting a rule keeps already-created transactions.
- Password-reset links are delivered by the dev mail stub (`utils/mailer.ts`): printed to the
  server console **and** appended to `server/.mail-outbox.txt` (gitignored). Swap that one
  function for nodemailer / a provider SDK to send real emails — no caller needs to change.
- Receipts are stored in `server/uploads/` (gitignored) under random filenames and served only
  through the authenticated API — visible to the author, or any member of the group the expense
  belongs to. Removing a receipt or deleting the transaction unlinks the file.
- Group members are permanent by design (that keeps the equal-split math honest); deleting a
  group keeps its transactions as personal expenses of whoever logged them. Group entries are
  expense-only and always split equally across the current members.
- The recurring dedupe index is a unique **partial** index on (user, rule, date) — manual entries
  never hit it, so two personal transactions on the same date are fine. (A plain unique-sparse
  compound index would have wrongly blocked them.)
- PWA: run `npm run build && npm run preview` (or deploy) to test install/offline — the dev server
  intentionally ships no service worker.

## Roadmap (Phase 2 ideas)

Deployment walkthrough (Docker + a hosted MongoDB cluster) · real SMTP/email provider plug-in
for the reset mail · budget/recurring notifications.

---

Author: Aashish — built with the MERN stack.
