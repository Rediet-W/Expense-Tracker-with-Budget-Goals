"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Expense } from "@/types/expense";
import { BudgetGoal } from "@/types/budget";
import { PieChart, Pie, Tooltip, Legend } from "recharts";

export default function Dashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [form, setForm] = useState({
    date: "",
    description: "",
    amount: "",
    category: "",
  });

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  const [showModal, setShowModal] = useState(false);
  const [pendingExpense, setPendingExpense] = useState<typeof form | null>(
    null
  );

  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [categoryChartData, setCategoryChartData] = useState<
    { name: string; value: number }[]
  >([]);

  const [goal, setGoal] = useState<BudgetGoal | null>(null);
  const [goalAmount, setGoalAmount] = useState("");
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const startDate = `${currentYear}-${String(currentMonth).padStart(
    2,
    "0"
  )}-01`;
  const endDate = new Date(currentYear, currentMonth, 0)
    .toISOString()
    .split("T")[0]; // 'YYYY-MM-DD'

  const fetchUserAndExpenses = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return router.push("/login");

    setUserEmail(user.email ?? null);

    // 1. Fetch expenses
    const { data: expensesData } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    setExpenses(expensesData as Expense[]);

    // 2. Fetch monthly spending
    const { data: monthlySpendingData } = await supabase
      .from("expenses")
      .select("amount")
      .eq("user_id", user.id)
      .gte("date", startDate)
      .lte("date", endDate);

    const totalSpent =
      monthlySpendingData?.reduce((sum, exp) => sum + Number(exp.amount), 0) ??
      0;

    setMonthlyTotal(totalSpent);

    const { data: goalData, error: budgetError } = await supabase
      .from("budget_goals")
      .select("*")
      .eq("user_id", user.id)
      .eq("month", currentMonth)
      .eq("year", currentYear)
      .maybeSingle();

    if (budgetError) {
      console.error("Budget fetch error:", budgetError.message);
    }

    setGoal(goalData);
    setGoalAmount(goalData?.goal_amount ?? "");

    // Fetch custom categories
    const { data: categoryData } = await supabase
      .from("categories")
      .select("name")
      .eq("user_id", user.id);

    setCategories(categoryData?.map((c) => c.name) || []);

    const { data: categoryTotals } = await supabase
      .from("expenses")
      .select("category, amount")
      .eq("user_id", user.id)
      .gte("date", startDate)
      .lte("date", endDate);

    const totalsByCategory: { [category: string]: number } = {};

    categoryTotals?.forEach((exp) => {
      if (!totalsByCategory[exp.category]) {
        totalsByCategory[exp.category] = 0;
      }
      totalsByCategory[exp.category] += Number(exp.amount);
    });

    const chartData = Object.entries(totalsByCategory).map(
      ([category, total]) => ({
        name: category,
        value: total,
      })
    );

    setCategoryChartData(chartData);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    const newAmount = parseFloat(form.amount);
    const futureTotal = monthlyTotal + newAmount;

    if (goal && futureTotal > goal.goal_amount) {
      setPendingExpense(form);
      setShowModal(true);
      return;
    }

    await addExpense(form);
  };

  const addExpense = async (expense: typeof form) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from("expenses").insert({
      ...expense,
      amount: parseFloat(expense.amount),
      user_id: user.id,
    });

    if (!error) {
      setForm({ date: "", description: "", amount: "", category: "" });
      fetchUserAndExpenses();
    } else {
      console.error("Insert failed:", error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleDeleteExpense = async (id: string) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);

    if (!error) {
      fetchUserAndExpenses();
    } else {
      console.error("Delete failed:", error.message);
    }
  };
  useEffect(() => {
    const fetchData = async () => {
      await fetchUserAndExpenses();
    };
    fetchData();
  }, [fetchUserAndExpenses]);
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl font-bold">Welcome, {userEmail}</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>
      <div className="mb-8 bg-gray-100 p-4 rounded shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Monthly Budget Summary</h2>
        <p>
          Total spent this month: <strong>${monthlyTotal}</strong>
        </p>
        {goal ? (
          <p>
            Budget: <strong>${goal.goal_amount}</strong> | Remaining:{" "}
            <strong
              className={
                monthlyTotal > goal.goal_amount
                  ? "text-red-500"
                  : "text-green-600"
              }
            >
              ${goal.goal_amount - monthlyTotal}
            </strong>
          </p>
        ) : (
          <p className="text-yellow-600">No budget set for this month</p>
        )}
      </div>
      <div className="flex justify-between">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;
            if (!newCategory.trim()) return;

            const { error } = await supabase.from("categories").insert({
              name: newCategory,
              user_id: user.id,
            });

            if (!error) {
              setNewCategory("");
              fetchUserAndExpenses();
            }
          }}
          className="mb-6 flex gap-2"
        >
          <input
            type="text"
            placeholder="New Category"
            className="border p-2 rounded"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 rounded"
          >
            Add Category
          </button>
        </form>

        <form
          onSubmit={async (e) => {
            e.preventDefault();

            const {
              data: { user },
            } = await supabase.auth.getUser();

            if (!user) return;

            if (goal) {
              await supabase
                .from("budget_goals")
                .update({
                  goal_amount: parseFloat(goalAmount),
                })
                .eq("id", goal.id);
            } else {
              await supabase.from("budget_goals").insert({
                goal_amount: parseFloat(goalAmount),
                user_id: user.id,
                month: currentMonth,
                year: currentYear,
              });
            }

            fetchUserAndExpenses();
          }}
          className="mb-6 flex gap-2"
        >
          <input
            type="number"
            placeholder="Set Monthly Budget"
            className="border p-2 rounded"
            value={goalAmount}
            onChange={(e) => setGoalAmount(e.target.value)}
          />
          <button
            type="submit"
            className="bg-green-600 text-white px-4 rounded"
          >
            {goal ? "Update" : "Set"}
          </button>
        </form>
      </div>
      <form
        onSubmit={handleAddExpense}
        className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <input
          type="date"
          required
          className="border p-2 rounded"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
        <input
          type="text"
          placeholder="Description"
          required
          className="border p-2 rounded"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <input
          type="number"
          placeholder="Amount"
          required
          className="border p-2 rounded"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
        />

        <select
          required
          className="border p-2 rounded"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          <option value="">Select category</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="col-span-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Add Expense
        </button>
      </form>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md">
            <h2 className="text-lg font-bold mb-4">⚠️ Over Budget</h2>
            <p className="mb-4">
              Adding this expense will put you over your monthly budget. Are you
              sure you want to continue?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowModal(false);
                  setPendingExpense(null);
                }}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (pendingExpense) {
                    addExpense(pendingExpense);
                    setShowModal(false);
                    setPendingExpense(null);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                Proceed Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold mb-2">Recent Expenses</h2>
      <div className="overflow-x-auto">
        <table className="w-full table-auto border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">Date</th>
              <th className="p-2">Description</th>
              <th className="p-2">Amount</th>
              <th className="p-2">Category</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((exp) => (
              <tr key={exp.id}>
                <td className="p-2">{exp.date}</td>
                <td className="p-2">{exp.description}</td>
                <td className="p-2">${exp.amount}</td>
                <td className="p-2">{exp.category}</td>
                <td className="p-2 text-right">
                  <button
                    onClick={() => handleDeleteExpense(exp.id)}
                    className="text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {categoryChartData.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-2">Spending by Category</h2>
            <div className="flex justify-center">
              <PieChart width={300} height={300}>
                <Pie
                  data={categoryChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  label
                />
                <Tooltip />
                <Legend />
              </PieChart>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
