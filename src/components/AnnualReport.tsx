import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction } from "@/types/transaction";
import { format, startOfYear, endOfYear, subYears, addYears, isWithinInterval, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";

interface AnnualReportProps {
  transactions: Transaction[];
}

export const AnnualReport = ({ transactions }: AnnualReportProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const currentYearStart = startOfYear(selectedDate);
  const currentYearEnd = endOfYear(selectedDate);
  
  const previousYearStart = startOfYear(subYears(selectedDate, 1));
  const previousYearEnd = endOfYear(subYears(selectedDate, 1));

  const getCurrentYearTransactions = () => {
    return transactions.filter((t) =>
      isWithinInterval(new Date(t.date), { start: currentYearStart, end: currentYearEnd })
    );
  };

  const getPreviousYearTransactions = () => {
    return transactions.filter((t) =>
      isWithinInterval(new Date(t.date), { start: previousYearStart, end: previousYearEnd })
    );
  };

  const calculateYearTotals = (txs: Transaction[]) => {
    const income = txs.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const expense = txs.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expense;
    return { income, expense, balance };
  };

  const getMonthlyData = () => {
    const months = eachMonthOfInterval({ start: currentYearStart, end: currentYearEnd });
    
    return months.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthTransactions = transactions.filter((t) =>
        isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
      );
      
      const income = monthTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expense = monthTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
      
      return {
        month: format(month, "MMM", { locale: ptBR }),
        receita: income,
        despesa: expense,
        saldo: income - expense,
      };
    });
  };

  const currentYear = calculateYearTotals(getCurrentYearTransactions());
  const previousYear = calculateYearTotals(getPreviousYearTransactions());

  const incomeChange = previousYear.income === 0 
    ? 0 
    : ((currentYear.income - previousYear.income) / previousYear.income) * 100;
  
  const expenseChange = previousYear.expense === 0 
    ? 0 
    : ((currentYear.expense - previousYear.expense) / previousYear.expense) * 100;

  const monthlyData = getMonthlyData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handlePreviousYear = () => {
    setSelectedDate(subYears(selectedDate, 1));
  };

  const handleNextYear = () => {
    setSelectedDate(addYears(selectedDate, 1));
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.text("Relatório Anual", 14, 20);
    doc.setFontSize(14);
    doc.text(format(currentYearStart, "yyyy", { locale: ptBR }), 14, 30);
    
    // Resumo
    doc.setFontSize(12);
    doc.text("Resumo Financeiro", 14, 45);
    doc.setFontSize(10);
    doc.text(`Receitas Totais: ${formatCurrency(currentYear.income)} (${formatPercentage(incomeChange)})`, 14, 55);
    doc.text(`Despesas Totais: ${formatCurrency(currentYear.expense)} (${formatPercentage(expenseChange)})`, 14, 62);
    doc.text(`Saldo Anual: ${formatCurrency(currentYear.balance)}`, 14, 69);
    
    // Evolução Mensal
    doc.setFontSize(12);
    doc.text("Evolução Mensal", 14, 84);
    doc.setFontSize(10);
    
    let yPos = 94;
    monthlyData.forEach((data) => {
      doc.text(`${data.month}: Receitas ${formatCurrency(data.receita)} | Despesas ${formatCurrency(data.despesa)} | Saldo ${formatCurrency(data.saldo)}`, 14, yPos);
      yPos += 7;
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
    });
    
    doc.save(`relatorio-anual-${format(selectedDate, "yyyy")}.pdf`);
  };

  const formatPercentage = (value: number) => {
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Relatório Anual</CardTitle>
            <p className="text-sm text-muted-foreground">
              {format(currentYearStart, "yyyy", { locale: ptBR })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousYear}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextYear}
              disabled={selectedDate >= new Date()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Receitas Totais</p>
            <p className="text-2xl font-bold text-success">{formatCurrency(currentYear.income)}</p>
            <div className="flex items-center gap-2 text-sm">
              {incomeChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              <span className={incomeChange >= 0 ? "text-success" : "text-destructive"}>
                {formatPercentage(incomeChange)}
              </span>
              <span className="text-muted-foreground">vs {format(previousYearStart, "yyyy")}</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Despesas Totais</p>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(currentYear.expense)}</p>
            <div className="flex items-center gap-2 text-sm">
              {expenseChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-destructive" />
              ) : (
                <TrendingDown className="h-4 w-4 text-success" />
              )}
              <span className={expenseChange >= 0 ? "text-destructive" : "text-success"}>
                {formatPercentage(expenseChange)}
              </span>
              <span className="text-muted-foreground">vs {format(previousYearStart, "yyyy")}</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Saldo Anual</p>
            <p className={`text-2xl font-bold ${currentYear.balance >= 0 ? "text-success" : "text-destructive"}`}>
              {formatCurrency(currentYear.balance)}
            </p>
            <p className="text-sm text-muted-foreground">
              {format(previousYearStart, "yyyy")}: {formatCurrency(previousYear.balance)}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Evolução Mensal</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="receita" fill="hsl(var(--success))" name="Receita" />
              <Bar dataKey="despesa" fill="hsl(var(--destructive))" name="Despesa" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
