import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";

const PendingApproval = () => {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center overflow-hidden" style={{ height: '160px' }}>
            <img 
              src={logo} 
              alt="FINZ" 
              className="h-full w-auto"
              style={{ 
                objectFit: 'contain',
                objectPosition: 'center',
                transform: 'scale(1.0)'
              }} 
            />
          </div>
          <div className="text-center">
            <CardDescription>Gerencie seu dinheiro com facilidade</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold">Cadastro Pendente de Aprovação</h2>
            <p className="text-muted-foreground">
              Seu cadastro foi realizado com sucesso! Aguarde a aprovação de um administrador para ter acesso ao sistema.
            </p>
            <p className="text-sm text-muted-foreground">
              Você receberá uma notificação quando sua conta for aprovada.
            </p>
          </div>
          <Button 
            onClick={signOut} 
            variant="outline" 
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApproval;
