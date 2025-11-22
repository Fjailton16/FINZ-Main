import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, Check, Trash2, UserCog, Settings, User } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  approved: boolean;
  created_at: string;
}

interface UserRole {
  userId: string;
  roles: string[];
}

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, approved, signOut } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMaster, setIsMaster] = useState(false);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (!authLoading && user && approved === false) {
      navigate("/pending-approval");
      return;
    }

    if (user) {
      checkAdminStatus();
    }
  }, [user, authLoading, approved, navigate]);

  const checkAdminStatus = async () => {
    if (!user) return;

    console.log("Verificando status de admin para:", user.email, user.id);

    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "master"]);

    console.log("Resultado da verificação:", { data, error });

    if (error || !data || data.length === 0) {
      console.error("Usuário não é admin:", error);
      toast.error("Você não tem permissão para acessar esta página");
      navigate("/");
      return;
    }

    const masterRole = data.some(r => r.role === "master");
    console.log("É admin:", true, "É master:", masterRole);
    
    setIsAdmin(true);
    setIsMaster(masterRole);
    fetchProfiles();
  };

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar usuários");
      console.error(error);
    } else {
      setProfiles(data || []);
      
      // Buscar roles de todos os usuários
      if (data && data.length > 0) {
        const { data: rolesData } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", data.map(p => p.id));

        if (rolesData) {
          const rolesMap: UserRole[] = data.map(profile => ({
            userId: profile.id,
            roles: rolesData
              .filter(r => r.user_id === profile.id)
              .map(r => r.role)
          }));
          setUserRoles(rolesMap);
        }
      }
    }
    setLoading(false);
  };

  const getUserRoles = (userId: string): string[] => {
    return userRoles.find(ur => ur.userId === userId)?.roles || [];
  };

  const isUserAdmin = (userId: string): boolean => {
    const roles = getUserRoles(userId);
    return roles.includes('admin') || roles.includes('master');
  };

  const handleApprove = async (profileId: string) => {
    // Buscar dados do usuário antes de aprovar
    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", profileId)
      .single();

    const { error } = await supabase
      .from("profiles")
      .update({ approved: true })
      .eq("id", profileId);

    if (error) {
      toast.error("Erro ao aprovar usuário");
      console.error(error);
    } else {
      // Enviar email de aprovação
      if (profileData) {
        try {
          await supabase.functions.invoke('send-approval-email', {
            body: { 
              name: profileData.full_name || 'Usuário', 
              email: profileData.email 
            }
          });
        } catch (emailError) {
          console.error("Erro ao enviar email de aprovação:", emailError);
        }
      }
      
      toast.success("Usuário aprovado com sucesso!");
      fetchProfiles();
    }
  };

  const handleMakeAdmin = async (profileId: string, profileEmail: string) => {
    if (!isMaster) {
      toast.error("Apenas Master pode tornar usuários em administradores");
      return;
    }

    if (!confirm(`Tem certeza que deseja tornar ${profileEmail} um administrador?`)) {
      return;
    }

    // Check if user already has admin role
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", profileId)
      .eq("role", "admin")
      .maybeSingle();

    if (existingRole) {
      toast.error("Este usuário já é administrador");
      return;
    }

    const { error } = await supabase
      .from("user_roles")
      .insert({
        user_id: profileId,
        role: "admin"
      });

    if (error) {
      toast.error("Erro ao tornar usuário administrador");
      console.error(error);
    } else {
      // Buscar informações do usuário para enviar email
      const { data: userData } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", profileId)
        .single();

      if (userData) {
        // Enviar email de notificação de promoção
        await supabase.functions.invoke('send-admin-promotion-email', {
          body: {
            name: userData.full_name,
            email: userData.email
          }
        });
      }

      toast.success("Usuário agora é administrador!");
      fetchProfiles();
    }
  };

  const handleDelete = async (profileId: string) => {
    if (!isMaster) {
      toast.error("Apenas Master pode excluir usuários");
      return;
    }

    if (!confirm("Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita e removerá completamente o usuário do sistema.")) {
      return;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('delete-user-completely', {
        body: { userId: profileId },
        headers: {
          Authorization: `Bearer ${sessionData?.session?.access_token}`
        }
      });

      if (error) {
        toast.error("Erro ao excluir usuário: " + error.message);
        console.error(error);
      } else {
        toast.success("Usuário excluído completamente do sistema!");
        fetchProfiles();
      }
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      toast.error("Erro ao excluir usuário");
    }
  };


  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={logo} alt="FINZ" className="h-10 md:h-12 w-auto" style={{ objectFit: 'contain' }} />
              <div>
                <h1 className="text-xl md:text-2xl font-bold">
                  {isMaster ? "Painel Master" : "Administração"}
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {isMaster ? "Gerenciar e excluir usuários" : "Gerenciar usuários"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button 
                variant="outline" 
                onClick={() => navigate("/")}
                className="hidden sm:flex"
              >
                Voltar ao Dashboard
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => navigate("/")}
                title="Voltar ao Dashboard"
                className="sm:hidden"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigate("/profile")} title="Perfil">
                <User className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={signOut} title="Sair">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Gerenciamento de Usuários</CardTitle>
            <CardDescription>
              Aprove novos cadastros ou exclua usuários. Masters podem tornar usuários em administradores.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pending">
                  Pendentes ({profiles.filter(p => p.approved === false).length})
                </TabsTrigger>
                <TabsTrigger value="approved">
                  Aprovados ({profiles.filter(p => p.approved === true).length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Data de Cadastro</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles.filter(p => p.approved === false).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          Nenhum cadastro pendente de aprovação
                        </TableCell>
                      </TableRow>
                    ) : (
                      profiles.filter(p => p.approved === false).map((profile) => (
                        <TableRow key={profile.id}>
                          <TableCell className="font-medium">
                            {profile.full_name || "Sem nome"}
                          </TableCell>
                          <TableCell>{profile.email}</TableCell>
                          <TableCell>
                            {new Date(profile.created_at).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApprove(profile.id)}
                                variant="default"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Aprovar
                              </Button>
                              {isMaster && (
                                <Button
                                  size="sm"
                                  onClick={() => handleDelete(profile.id)}
                                  variant="destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Excluir
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="approved" className="mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Papel</TableHead>
                      <TableHead>Data de Cadastro</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles.filter(p => p.approved === true).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Nenhum usuário aprovado
                        </TableCell>
                      </TableRow>
                    ) : (
                      profiles.filter(p => p.approved === true).map((profile) => {
                        const roles = getUserRoles(profile.id);
                        const isMasterUser = roles.includes('master');
                        const isAdminUser = roles.includes('admin');
                        
                        return (
                          <TableRow 
                            key={profile.id}
                            className={isMasterUser || isAdminUser ? "bg-accent/50" : ""}
                          >
                            <TableCell className="font-medium">
                              {profile.full_name || "Sem nome"}
                            </TableCell>
                            <TableCell>{profile.email}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {isMasterUser && (
                                  <Badge variant="default" className="bg-primary">
                                    Master
                                  </Badge>
                                )}
                                {isAdminUser && (
                                  <Badge variant="secondary">
                                    Admin
                                  </Badge>
                                )}
                                {!isMasterUser && !isAdminUser && (
                                  <Badge variant="outline">
                                    Usuário
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(profile.created_at).toLocaleDateString("pt-BR")}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {isMaster && (
                                  <>
                                    {!isUserAdmin(profile.id) && (
                                      <Button
                                        size="sm"
                                        onClick={() => handleMakeAdmin(profile.id, profile.email)}
                                        variant="secondary"
                                      >
                                        <UserCog className="h-4 w-4 mr-1" />
                                        Tornar Admin
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      onClick={() => handleDelete(profile.id)}
                                      variant="destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      Excluir
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="all" className="mt-6">
                <p className="text-muted-foreground text-center py-8">
                  Use as abas acima para gerenciar usuários pendentes ou aprovados
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

      </main>
    </div>
  );
};

export default Admin;
