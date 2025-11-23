import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction } from "@/types/transaction";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TrendChartProps {
  transactions: Transaction[];
}

export const TrendChart = ({ transactions }: TrendChartProps) => {
  // Get last 30 days of data
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const days = eachDayOfInterval({ start: thirtyDaysAgo, end: today });
  
  const chartData = days.map((day) => {
    const dayTransactions = transactions.filter((t) => 
      isSameDay(new Date(t.date), day)
    );
    
    const income = dayTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = dayTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      date: format(day, "dd/MM", { locale: ptBR }),
      receita: income,
      despesa: expense,
    };
  });

  return (
    <Card data-tour="trend-chart">
      <CardHeader>
        <CardTitle>Tendência (Últimos 30 Dias)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              formatter={(value: number) =>
                new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(value)
              }
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="receita" 
              stroke="hsl(var(--success))" 
              strokeWidth={2}
              name="Receita"
            />
            <Line 
              type="monotone" 
              dataKey="despesa" 
              stroke="hsl(var(--destructive))" 
              strokeWidth={2}
              name="Despesa"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
