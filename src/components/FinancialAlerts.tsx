import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Transaction } from "@/types/transaction";
import { AlertTriangle, TrendingDown, CheckCircle, AlertCircle } from "lucide-react";

interface FinancialAlertsProps {
  transactions: Transaction[];
}

export const FinancialAlerts = ({ transactions }: FinancialAlertsProps) => {
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  // Get last 7 days transactions
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentTransactions = transactions.filter(
    (t) => new Date(t.date) >= sevenDaysAgo
  );
  
  const recentExpenses = recentTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const alerts = [];

  // Alert 1: Negative balance
  if (balance < 0) {
    alerts.push({
      type: "error",
      icon: AlertTriangle,
      title: "Saldo Negativo",
      description: `Suas despesas excedem suas receitas em ${new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(Math.abs(balance))}. Revise seus gastos.`,
    });
  }

  // Alert 2: High recent spending
  if (recentExpenses > totalIncome * 0.3 && totalIncome > 0) {
    alerts.push({
      type: "warning",
      icon: TrendingDown,
      title: "Gastos Elevados",
      description: `Você gastou ${new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(recentExpenses)} nos últimos 7 dias. Considere reduzir despesas.`,
    });
  }

  // Alert 3: Positive balance and healthy spending
  if (balance > 0 && totalExpenses < totalIncome * 0.7 && totalIncome > 0) {
    alerts.push({
      type: "success",
      icon: CheckCircle,
      title: "Finanças Saudáveis",
      description: `Parabéns! Você está mantendo um bom controle financeiro com saldo positivo de ${new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(balance)}.`,
    });
  }

  // Alert 4: No transactions
  if (transactions.length === 0) {
    alerts.push({
      type: "info",
      icon: AlertCircle,
      title: "Comece a Registrar",
      description: "Adicione suas primeiras transações para começar a acompanhar suas finanças.",
    });
  }

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-4" data-tour="alerts">
      {alerts.map((alert, index) => (
        <Alert
          key={index}
          variant={alert.type === "error" ? "destructive" : "default"}
          className={
            alert.type === "success"
              ? "border-success/50 bg-success/5"
              : alert.type === "warning"
              ? "border-yellow-500/50 bg-yellow-500/5"
              : alert.type === "info"
              ? "border-primary/50 bg-primary/5"
              : ""
          }
        >
          <alert.icon className="h-4 w-4" />
          <AlertTitle>{alert.title}</AlertTitle>
          <AlertDescription>{alert.description}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
};
