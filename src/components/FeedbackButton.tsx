import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, X, Send } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast({
        title: "Feedback vazio",
        description: "Por favor, escreva seu feedback antes de enviar.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.functions.invoke("send-feedback", {
        body: {
          feedback: feedback.trim(),
          userEmail: user?.email || "Usuário anônimo",
          userName: user?.user_metadata?.full_name || "Usuário"
        }
      });

      if (error) throw error;

      toast({
        title: "Feedback enviado! 🎉",
        description: "Obrigado por compartilhar sua opinião conosco."
      });

      setFeedback("");
      setOpen(false);
    } catch (error) {
      console.error("Erro ao enviar feedback:", error);
      toast({
        title: "Erro ao enviar feedback",
        description: "Não foi possível enviar seu feedback. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg hover:scale-110 transition-transform z-50"
        size="icon"
        title="Enviar Feedback"
      >
        <MessageSquare className="w-5 h-5" />
      </Button>

      {/* Feedback dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Feedback</DialogTitle>
            <DialogDescription>
              Conte-nos o que você está achando do sistema. Sua opinião é muito importante para nós!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              placeholder="Escreva seu feedback aqui..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={6}
              className="resize-none"
            />

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
              >
                <Send className="w-4 h-4 mr-2" />
                {loading ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
