import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "@/types/transaction";
import { toast } from "sonner";

export const useTransactions = (userId: string | undefined) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    if (!userId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false });

      if (error) throw error;

      const formattedData: Transaction[] = (data || []).map((item) => ({
        id: item.id,
        type: item.type as "income" | "expense",
        category: item.category,
        amount: Number(item.amount),
        date: item.date,
        description: item.description || undefined,
      }));

      setTransactions(formattedData);
    } catch (error: any) {
      toast.error("Erro ao carregar transações");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();

    const channel = supabase
      .channel("transactions-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const addTransaction = async (transaction: Omit<Transaction, "id">) => {
    if (!userId) return;

    try {
      const { error } = await supabase.from("transactions").insert({
        user_id: userId,
        type: transaction.type,
        category: transaction.category,
        amount: transaction.amount,
        date: transaction.date,
        description: transaction.description,
      });

      if (error) throw error;

      toast.success("Transação adicionada com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao adicionar transação");
      console.error(error);
    }
  };

  const updateTransaction = async (transaction: Transaction) => {
    try {
      const { error } = await supabase
        .from("transactions")
        .update({
          type: transaction.type,
          category: transaction.category,
          amount: transaction.amount,
          date: transaction.date,
          description: transaction.description,
        })
        .eq("id", transaction.id);

      if (error) throw error;

      toast.success("Transação atualizada com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao atualizar transação");
      console.error(error);
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase.from("transactions").delete().eq("id", id);

      if (error) throw error;

      toast.success("Transação excluída com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao excluir transação");
      console.error(error);
    }
  };

  return {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };
};
