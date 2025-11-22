import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction } from "@/types/transaction";
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, TrendingDown, ArrowRight, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";

interface MonthlyReportProps {
  transactions: Transaction[];
}

export const MonthlyReport = ({ transactions }: MonthlyReportProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const currentMonthStart = startOfMonth(selectedDate);
  const currentMonthEnd = endOfMonth(selectedDate);
  
  const previousMonthStart = startOfMonth(subMonths(selectedDate, 1));
  const previousMonthEnd = endOfMonth(subMonths(selectedDate, 1));

  const getCurrentMonthTransactions = () => {
    return transactions.filter((t) =>
      isWithinInterval(new Date(t.date), { start: currentMonthStart, end: currentMonthEnd })
    );
  };

  const getPreviousMonthTransactions = () => {
    return transactions.filter((t) =>
      isWithinInterval(new Date(t.date), { start: previousMonthStart, end: previousMonthEnd })
    );
  };

  const calculateTotals = (txs: Transaction[]) => {
    const income = txs.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const expense = txs.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expense;
    
    const categoryBreakdown = txs.reduce((acc, t) => {
      if (!acc[t.category]) {
        acc[t.category] = { income: 0, expense: 0 };
      }
      if (t.type === "income") {
        acc[t.category].income += t.amount;
      } else {
        acc[t.category].expense += t.amount;
      }
      return acc;
    }, {} as Record<string, { income: number; expense: number }>);

    return { income, expense, balance, categoryBreakdown };
  };

  const currentMonth = calculateTotals(getCurrentMonthTransactions());
  const previousMonth = calculateTotals(getPreviousMonthTransactions());

  const incomeChange = previousMonth.income === 0 
    ? 0 
    : ((currentMonth.income - previousMonth.income) / previousMonth.income) * 100;
  
  const expenseChange = previousMonth.expense === 0 
    ? 0 
    : ((currentMonth.expense - previousMonth.expense) / previousMonth.expense) * 100;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handlePreviousMonth = () => {
    setSelectedDate(subMonths(selectedDate, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(addMonths(selectedDate, 1));
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.text("Relatório Mensal", 14, 20);
    doc.setFontSize(14);
    doc.text(format(currentMonthStart, "MMMM 'de' yyyy", { locale: ptBR }), 14, 30);
    
    // Resumo
    doc.setFontSize(12);
    doc.text("Resumo Financeiro", 14, 45);
    doc.setFontSize(10);
    doc.text(`Receitas: ${formatCurrency(currentMonth.income)} (${formatPercentage(incomeChange)})`, 14, 55);
    doc.text(`Despesas: ${formatCurrency(currentMonth.expense)} (${formatPercentage(expenseChange)})`, 14, 62);
    doc.text(`Saldo: ${formatCurrency(currentMonth.balance)}`, 14, 69);
    
    // Despesas por Categoria
    doc.setFontSize(12);
    doc.text("Despesas por Categoria", 14, 84);
    doc.setFontSize(10);
    
    let yPos = 94;
    Object.entries(currentMonth.categoryBreakdown)
      .filter(([_, values]) => values.expense > 0)
      .sort((a, b) => b[1].expense - a[1].expense)
      .forEach(([category, values]) => {
        const percentage = (values.expense / currentMonth.expense) * 100;
        doc.text(`${category}: ${formatCurrency(values.expense)} (${percentage.toFixed(1)}%)`, 14, yPos);
        yPos += 7;
      });
    
    doc.save(`relatorio-mensal-${format(selectedDate, "yyyy-MM")}.pdf`);
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
            <CardTitle>Relatório Mensal</CardTitle>
            <p className="text-sm text-muted-foreground">
              {format(currentMonthStart, "MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
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
            <p className="text-sm text-muted-foreground">Receitas</p>
            <p className="text-2xl font-bold text-success">{formatCurrency(currentMonth.income)}</p>
            <div className="flex items-center gap-2 text-sm">
              {incomeChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              <span className={incomeChange >= 0 ? "text-success" : "text-destructive"}>
                {formatPercentage(incomeChange)}
              </span>
              <span className="text-muted-foreground">vs mês anterior</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Despesas</p>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(currentMonth.expense)}</p>
            <div className="flex items-center gap-2 text-sm">
              {expenseChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-destructive" />
              ) : (
                <TrendingDown className="h-4 w-4 text-success" />
              )}
              <span className={expenseChange >= 0 ? "text-destructive" : "text-success"}>
                {formatPercentage(expenseChange)}
              </span>
              <span className="text-muted-foreground">vs mês anterior</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Saldo</p>
            <p className={`text-2xl font-bold ${currentMonth.balance >= 0 ? "text-success" : "text-destructive"}`}>
              {formatCurrency(currentMonth.balance)}
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowRight className="h-4 w-4" />
              Mês anterior: {formatCurrency(previousMonth.balance)}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Despesas por Categoria</h4>
          <div className="space-y-2">
            {Object.entries(currentMonth.categoryBreakdown)
              .filter(([_, values]) => values.expense > 0)
              .sort((a, b) => b[1].expense - a[1].expense)
              .map(([category, values]) => {
                const percentage = (values.expense / currentMonth.expense) * 100;
                return (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{category}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <span className="text-sm font-medium">{formatCurrency(values.expense)}</span>
                  </div>
                );
              })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
