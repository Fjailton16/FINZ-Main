import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction } from "@/types/transaction";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface ExpenseChartProps {
  transactions: Transaction[];
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export const ExpenseChart = ({ transactions }: ExpenseChartProps) => {
  const expenses = transactions.filter((t) => t.type === "expense");

  const categoryData = expenses.reduce((acc, transaction) => {
    const existing = acc.find((item) => item.name === transaction.category);
    if (existing) {
      existing.value += transaction.amount;
    } else {
      acc.push({ name: transaction.category, value: transaction.amount });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  if (categoryData.length === 0) {
    return (
      <Card data-tour="expense-chart">
        <CardHeader>
          <CardTitle>Despesas por Categoria</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-muted-foreground">Nenhuma despesa para exibir</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-tour="expense-chart">
      <CardHeader>
        <CardTitle>Despesas por Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {categoryData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) =>
                new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(value)
              }
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
