import { useEffect, useState } from "react";
import Joyride, { ACTIONS, CallBackProps, EVENTS, STATUS, Step } from "react-joyride";
import { useIsMobile } from "@/hooks/use-mobile";

interface WelcomeTutorialProps {
  userName: string;
  onComplete: () => void;
}

export function WelcomeTutorial({ userName, onComplete }: WelcomeTutorialProps) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Wait for isMobile to be determined before starting tutorial
   if (typeof isMobile === 'boolean') { // Verifica se o hook já retornou um valor definido
    console.log("WelcomeTutorial: Iniciando tutorial, isMobile:", isMobile);
    setRun(true);
  }
}, [isMobile]);

  // Ouve quando uma transação é adicionada para avançar o passo automaticamente
  useEffect(() => {
    const handleTransactionAdded = (event: Event) => {
      const customEvent = event as CustomEvent<{ type?: string }>;
      const addedType = customEvent.detail?.type;

      setStepIndex((current) => {
        if (!run) return current;

        // Passo 2 (índice 2): adicionando RECEITA
        if (current === 2 && addedType === "income") {
          return 3;
        }

        // Passo 4 (índice 4): adicionando DESPESA
        if (current === 4 && addedType === "expense") {
          return 5;
        }

        return current;
      });
    };

    window.addEventListener("finz-transaction-added", handleTransactionAdded);
    return () => window.removeEventListener("finz-transaction-added", handleTransactionAdded);
  }, [run]);

  useEffect(() => {
    const handleDialogToggle = (event: Event) => {
      const customEvent = event as CustomEvent<{ open?: boolean }>;
      setIsTransactionDialogOpen(Boolean(customEvent.detail?.open));
    };

    window.addEventListener("finz-transaction-dialog-toggle", handleDialogToggle);
    return () => window.removeEventListener("finz-transaction-dialog-toggle", handleDialogToggle);
  }, []);

  // Garante que ao entrar no passo de Despesa o overlay comece escuro
  useEffect(() => {
    if (stepIndex === 4) {
      setIsTransactionDialogOpen(false);
    }
  }, [stepIndex]);

  const steps: Step[] = [
    {
      target: "body",
      placement: "center",
      disableBeacon: true,
      content: (
        <div className="space-y-3">
          <h2 className="text-xl font-bold">Bem-vindo ao FINZ, {userName}! 🎉</h2>
          <p className="text-sm">
            Vamos fazer um tour rápido. Você vai adicionar uma receita e uma despesa de exemplo.
          </p>
        </div>
      ),
    },
    {
      target: '[data-tour="summary-cards"]',
      placement: "bottom",
      content: (
        <div className="space-y-2 text-left">
          <h3 className="font-semibold">Visão geral financeira</h3>
          <p className="text-sm">Aqui você vê seu Saldo, Receitas e Despesas em tempo real.</p>
        </div>
      ),
    },
    {
      target: isTransactionDialogOpen ? '[data-tour="transaction-form"]' : '[data-tour="add-transaction"]',
      placement: isMobile && isTransactionDialogOpen ? "bottom" : "bottom",
      spotlightClicks: true,
      content: (
        <div className="space-y-2 text-left">
          <h3 className="font-semibold">Passo 1: Adicionar Receita 💰</h3>
          <p className="text-sm">
            Clique em <strong>"Adicionar Transação"</strong> e, na tela que abrir, preencha:
          </p>
          <ul className="text-xs list-disc list-inside space-y-0.5 ml-3">
            <li>Tipo: Receita</li>
            <li>Categoria: Salário</li>
            <li>Valor: 5000</li>
            <li>Descrição: Exemplo</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-1">
            Depois clique em "Adicionar" no formulário. O tutorial avançará automaticamente.
          </p>
        </div>
      ),
    },
    {
      target: '[data-tour="summary-cards"]',
      placement: "bottom",
      content: (
        <div className="space-y-2 text-left">
          <h3 className="font-semibold">Receita adicionada ✨</h3>
          <p className="text-sm">Se os cards mostrarem R$ 5.000, você concluiu este passo.</p>
          <p className="text-xs text-muted-foreground">
            Se ainda estiver zerado, volte um passo e finalize o cadastro da receita.
          </p>
        </div>
      ),
    },
    {
      target: isTransactionDialogOpen ? '[data-tour="transaction-form"]' : '[data-tour="add-transaction"]',
      placement: isMobile && isTransactionDialogOpen ? "bottom" : "bottom",
      spotlightClicks: true,
      content: (
        <div className="space-y-2 text-left">
          <h3 className="font-semibold">Passo 2: Adicionar Despesa 🛒</h3>
          <p className="text-sm">
            Clique novamente em <strong>"Adicionar Transação"</strong> e preencha:
          </p>
          <ul className="text-xs list-disc list-inside space-y-0.5 ml-3">
            <li>Tipo: Despesa</li>
            <li>Categoria: Compras</li>
            <li>Valor: 500</li>
            <li>Descrição: Exemplo</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-1">Salve o formulário. O tutorial avançará automaticamente.</p>
        </div>
      ),
    },
    {
      target: '[data-tour="summary-cards"]',
      placement: "bottom",
      content: (
        <div className="space-y-2 text-left">
          <h3 className="font-semibold">Despesa adicionada ✨</h3>
          <p className="text-sm">Se suas despesas mostrarem R$ 500, você concluiu este passo.</p>
          <p className="text-xs text-muted-foreground">
            Se ainda estiver zerado, volte um passo e finalize o cadastro da despesa.
          </p>
        </div>
      ),
    },
    {
      target: '[data-tour="summary-cards"]',
      placement: "bottom",
      content: (
        <div className="space-y-2 text-left">
          <h3 className="font-semibold">Entendendo o saldo 🎯</h3>
          <p className="text-sm">Saldo = Receitas - Despesas.</p>
          <p className="text-xs text-muted-foreground">Exemplo: R$ 5.000 - R$ 500 = R$ 4.500.</p>
        </div>
      ),
    },
    {
      target: '[data-tour="transaction-list"]',
      placement: isMobile ? "bottom" : "top",
      content: (
        <div className="space-y-2 text-left">
          <h3 className="font-semibold">Histórico de transações 📝</h3>
          <p className="text-sm">Aqui você edita (✏️) ou exclui (🗑️) qualquer lançamento.</p>
          <p className="text-xs text-muted-foreground">Você pode apagar as transações de exemplo quando quiser.</p>
        </div>
      ),
    },
    {
      target: '[data-tour="expense-chart"]',
      placement: isMobile ? "bottom" : "right",
      styles: isMobile ? {} : {
        tooltip: {
          transform: "translateY(40px)",
        },
      },
      content: (
        <div className="space-y-2 text-left">
          <h3 className="font-semibold">Gráfico de despesas 📊</h3>
          <p className="text-sm">Mostra em quais categorias você está gastando mais.</p>
        </div>
      ),
    },
    {
      target: '[data-tour="trend-chart"]',
      placement: isMobile ? "bottom" : "right",
      content: (
        <div className="space-y-2 text-left">
          <h3 className="font-semibold">Evolução mensal 📈</h3>
          <p className="text-sm">Acompanhe receitas e despesas ao longo do tempo.</p>
        </div>
      ),
    },
    {
      target: '[data-tour="alerts"]',
      placement: isMobile ? "bottom" : "right",
      content: (
        <div className="space-y-2 text-left">
          <h3 className="font-semibold">Alertas financeiros ⚠️</h3>
          <p className="text-sm">Avisos automáticos sobre situações importantes.</p>
        </div>
      ),
    },
    {
      target: '[data-tour="reports"]',
      target: isMobile ? '[data-tour="monthly-report"]' : '[data-tour="reports"]',
      placement: isMobile ? "bottom" : "right",
      content: (
        <div className="space-y-2 text-left">
          <h3 className="font-semibold">Relatórios em PDF 📄</h3>
          <p className="text-sm">Exporte relatórios mensais e anuais completos.</p>
        </div>
      ),
    },
    {
      target: "body",
      placement: "center",
      content: (
        <div className="space-y-3 text-left">
          <h2 className="text-xl font-bold">Pronto, {userName}! 👏</h2>
          <p className="text-sm">Agora você já sabe o básico para usar o FINZ.</p>
          <p className="text-xs text-muted-foreground">
            Comece a registrar seus dados reais e acompanhar seu dia a dia.
          </p>
        </div>
      ),
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, index, type } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      onComplete();
      return;
    }
    if (type === EVENTS.TARGET_NOT_FOUND) {
    console.error(`🚨 Joyride não encontrou o alvo do passo ${index}:`, steps[index].target);
  }

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      // Nos passos de adicionar Receita/Despesa (índices 2 e 4),
      // não deixamos avançar com "Próximo passo" ou clique no botão.
      // O avanço é feito apenas quando a transação é realmente adicionada.
      if ((index === 2 || index === 4) && action === ACTIONS.NEXT) {
        return;
      }

      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      spotlightClicks
      callback={handleJoyrideCallback}
      locale={{
        back: "Passo anterior",
        close: "Fechar",
        last: "Finalizar tutorial",
        next: "Próximo passo",
        nextLabelWithProgress: "Próximo passo ({step} de {steps})",
        open: "Abrir",
        skip: "Pular tutorial",
      }}
      styles={{
        options: {
          primaryColor: "hsl(var(--primary))",
          overlayColor: (() => {
            // Passos de adicionar transação (índices 2 e 4)
            if (stepIndex === 2 || stepIndex === 4) {
              return isTransactionDialogOpen ? "rgba(0,0,0,0)" : "rgba(0,0,0,0.5)";
            }
            // Passo de lista de transações: destaque mais suave no mobile
            if (stepIndex === 7 && isMobile) {
              return "rgba(0,0,0,0.25)";
            }
            // Outros passos com overlay padrão
            return "rgba(0,0,0,0.6)";
          })(),
          zIndex: 999999,
        },
        overlay: {
          pointerEvents: "none",
        },
        tooltip: {
          borderRadius: 12,
          padding: isMobile ? 10 : 16,
          maxWidth: isMobile ? 260 : 320,
          zIndex: 1000000,
        },
        tooltipContainer: {
          textAlign: "left",
        },
        spotlight: {
          borderRadius: 8,
        },
        beacon: {
          zIndex: 1000001,
        },
      }}
    />
  );
}