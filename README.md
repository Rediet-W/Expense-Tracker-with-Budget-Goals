# 💰 Expense Tracker with Budget Goals

A full-stack expense tracker built with **Next.js**, **Supabase**, and **Tailwind CSS**. Authenticated users can track their expenses, set monthly budgets, and visualize their spending.

Live Demo: [vercel link](https://expense-tracker-with-budget-goals-7x4o6mi8a-rediet-ws-projects.vercel.app/login)

---

## ✨ Features

- User Authentication (Supabase Auth)
- Add, view, and delete expenses
- Set and update monthly budget goals
- Summary of total spent vs remaining budget
- Visual report with Pie Chart (Recharts)
- Create and use custom categories
- Alert if user goes over budget
- Responsive and clean UI
- Deployed on Vercel

---

## 🛠️ Tech Stack

- **Frontend & Backend**: Next.js with TypeScript
- **Database & Auth**: Supabase
- **UI**: Tailwind CSS
- **Charts**: Recharts
- **Hosting**: Vercel

---

## 🧪 How to Run Locally

1. Clone the repo and install dependencies:

   ```bash
   git clone [https://github.com/Rediet-W/Expense-Tracker-with-Budget-Goals.git]
   cd expense-tracker
   npm install
   ```

2. Setup `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   ```

3. Run the dev server:

   ```bash
   npm run dev
   ```

---

## 🔐 Supabase Setup

Create the following tables and enable Row-Level Security:

### `expenses`
- id (uuid, PK)
- user_id (uuid)
- date (date)
- description (text)
- amount (float)
- category (text)
- currency (text)
- created_at (timestamp)

### `budget_goals`
- id (uuid, PK)
- user_id (uuid)
- month (int)
- year (int)
- goal_amount (float)

### `categories`
- id (uuid, PK)
- user_id (uuid)
- name (text)

---

## ✅ Bonus Features

- Custom categories
- Spending summary chart
- Budget warning modal

---

## 🌍 Deployment

Live demo: [https://expense-tracker-with-budget-goals-7x4o6mi8a-rediet-ws-projects.vercel.app/login]
