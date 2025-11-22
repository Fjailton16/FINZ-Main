import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpCircle, ArrowDownCircle, Wallet } from "lucide-react";
import { Transaction } from "@/types/transaction";

interface SummaryCardsProps {
  transactions: Transaction[];
}

export const SummaryCards = ({ transactions }: SummaryCardsProps) => {
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount);
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="border-success/20 bg-success/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(totalIncome)}</p>
            </div>
            <ArrowUpCircle className="h-10 w-10 text-success opacity-80" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Despesas Totais</p>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(totalExpenses)}</p>
            </div>
            <ArrowDownCircle className="h-10 w-10 text-destructive opacity-80" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Saldo</p>
              <p className={`text-2xl font-bold ${balance >= 0 ? "text-success" : "text-destructive"}`}>
                {formatCurrency(balance)}
              </p>
            </div>
            <Wallet className="h-10 w-10 text-primary opacity-80" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
