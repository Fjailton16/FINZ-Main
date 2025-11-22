export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  date: string;
  description?: string;
}

export const INCOME_CATEGORIES = [
  "Salário",
  "Freelance",
  "Investimento",
  "Negócio",
  "Presente",
  "Outra Receita",
];

export const EXPENSE_CATEGORIES = [
  "Supermercado",
  "Aluguel",
  "Contas",
  "Transporte",
  "Entretenimento",
  "Saúde",
  "Compras",
  "Restaurante",
  "Educação",
  "Outra Despesa",
];
