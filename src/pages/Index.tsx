import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Transaction } from "@/types/transaction";
import { SummaryCards } from "@/components/SummaryCards";
import { ExpenseChart } from "@/components/ExpenseChart";
import { TrendChart } from "@/components/TrendChart";
import { MonthlyReport } from "@/components/MonthlyReport";
import { AnnualReport } from "@/components/AnnualReport";
import { FinancialAlerts } from "@/components/FinancialAlerts";
import { TransactionList } from "@/components/TransactionList";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { EditTransactionDialog } from "@/components/EditTransactionDialog";
import { WelcomeTutorial } from "@/components/WelcomeTutorial";
import { FeedbackButton } from "@/components/FeedbackButton";
import { LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useTransactions } from "@/hooks/useTransactions";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, approved, signOut } = useAuth();
  const { transactions, loading: transactionsLoading, addTransaction, updateTransaction, deleteTransaction } = useTransactions(user?.id);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [showTutorial, setShowTutorial] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      console.log("=== VERIFICANDO ACESSO ===");
      console.log("authLoading:", authLoading, "user:", user?.email, "approved:", approved);

      // Wait for auth
      if (authLoading) {
        console.log("Aguardando autenticação...");
        return;
      }

      // No user - go to auth
      if (!user) {
        console.log("Sem usuário, redirecionando para /auth");
        navigate("/auth");
        return;
      }

      // CRITICAL: Wait for approval status to be loaded (not null)
      if (approved === null) {
        console.log("Aguardando status de aprovação ser carregado...");
        return;
      }

      console.log("Verificando papel de admin para:", user.email);

      // Check admin role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["admin", "master"]);

      const hasAdminRole = !!(roleData && roleData.length > 0);
      console.log("É admin/master?", hasAdminRole);
      setIsAdmin(hasAdminRole);

      // Fetch user's full name and first_login status
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, first_login")
        .eq("id", user.id)
        .maybeSingle();
      
      if (profileData?.full_name) {
        setUserName(profileData.full_name);
      }

      // Check if it's the first login
      if (profileData?.first_login === true) {
        setIsFirstLogin(true);
        setShowTutorial(true);
      }

      // Admin always gets access
      if (hasAdminRole) {
        console.log("Admin detectado, liberando acesso");
        setAccessChecked(true);
        return;
      }

      // Regular user - must have approved = true to access
      console.log("Usuário regular, verificando aprovação:", approved);
      if (approved === true) {
        console.log("Usuário aprovado, liberando acesso");
        setAccessChecked(true);
        return;
      }

      // Not approved (false) - go to pending
      console.log("Usuário não aprovado (false), redirecionando para /pending-approval");
      navigate("/pending-approval");
    };

    checkAccess();
  }, [user, authLoading, approved, navigate]);

  if (authLoading || transactionsLoading || !accessChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditDialogOpen(true);
  };

  const handleTutorialComplete = async () => {
    setShowTutorial(false);
    
    // Update first_login to false
    if (isFirstLogin && user?.id) {
      const { error } = await supabase
        .from("profiles")
        .update({ first_login: false })
        .eq("id", user.id);
      
      if (error) {
        console.error("Error updating first_login:", error);
      } else {
        setIsFirstLogin(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 h-12 md:h-16">
              <img 
                src={logo} 
                alt="FINZ" 
                className="h-full w-auto" 
                style={{ objectFit: 'contain' }} 
              />
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/admin")} 
                  title="Painel de Administração"
                  className="hidden sm:flex"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Administração
                </Button>
              )}
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => navigate("/admin")} 
                  title="Painel de Administração"
                  className="sm:hidden"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
              <div data-tour="add-transaction">
                <AddTransactionDialog onAdd={addTransaction} />
              </div>
              <Button variant="outline" size="icon" onClick={() => navigate("/profile")} title="Perfil">
                <User className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={signOut} title="Sair">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {userName && (
            <div className="mt-4 text-center">
              <p className="text-lg font-medium text-foreground">
                Olá, {userName.split(' ')[0].charAt(0).toUpperCase() + userName.split(' ')[0].slice(1).toLowerCase()}! 👋
              </p>
              <p className="text-sm text-muted-foreground">
                Bem-vindo de volta ao seu painel financeiro
              </p>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div data-tour="summary-cards">
            <SummaryCards transactions={transactions} />
          </div>

          <div data-tour="alerts">
            <FinancialAlerts transactions={transactions} />
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <ExpenseChart transactions={transactions} />
            <TrendChart transactions={transactions} />
          </div>

          <div className="grid gap-8 lg:grid-cols-2" data-tour="reports">
            <MonthlyReport transactions={transactions} />
            <AnnualReport transactions={transactions} />
          </div>

          <div data-tour="transaction-list">
            <TransactionList
              transactions={transactions}
              onDelete={deleteTransaction}
              onEdit={handleEditTransaction}
            />
          </div>
        </div>
      </main>

      <EditTransactionDialog
        transaction={editingTransaction}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onUpdate={updateTransaction}
      />

      {showTutorial && (
        <WelcomeTutorial 
          userName={userName.split(' ')[0].charAt(0).toUpperCase() + userName.split(' ')[0].slice(1).toLowerCase()} 
          onComplete={handleTutorialComplete} 
        />
      )}

      <FeedbackButton />
    </div>
  );
};

export default Index;
