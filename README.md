# 💰 FINZ - Gestão Financeira Pessoal

## 🎯 Sobre o Projeto

O FINZ é uma aplicação web dedicada ao **controle financeiro pessoal**. Seu objetivo é oferecer uma visão clara e completa sobre as finanças do usuário, permitindo o registro de despesas e receitas, e a geração de relatórios anuais e mensais.

O sistema foi construído com foco em **segurança e escalabilidade**, utilizando o **Supabase** como *backend* em tempo real.

O FINZ implementa um sistema de **permissões e autenticação rigoroso** (`user`, `admin`, `master`), garantindo que apenas usuários aprovados possam acessar e gerenciar seus dados financeiros.

---

## 🛠️ Stack Tecnológica

O projeto FINZ é construído com as seguintes tecnologias:

### Frontend (Aplicação Web)
* **React + Vite:** Framework JavaScript e *bundler* rápido.
* **TypeScript:** Linguagem para tipagem e código mais robusto.
* **Tailwind CSS:** Framework utilitário para estilização rápida e responsiva.
* **Shadcn/ui:** Componentes de interface de usuário modernos e acessíveis.

### Backend (Banco de Dados e Serviços)
* **Supabase:** *Backend* como Serviço (BaaS), incluindo:
    * **PostgreSQL:** Banco de dados relacional.
    * **Supabase Auth:** Gerenciamento de usuários e autenticação.
    * **Row Level Security (RLS):** Segurança de dados implementada diretamente no banco.
    * **Edge Functions (Deno):** Funções *serverless* para lógica de negócios crítica (ex: exclusão de contas, envio de e-mails de aprovação).
* **Resend:** Serviço de envio de e-mails transacionais (para aprovações, cancelamentos, etc.).

---

## 🏗️ Arquitetura e Fluxo de Permissões

O controle de acesso no FINZ é baseado em níveis, gerenciados via `app_role` (enum) na tabela `profiles`:

| Nível | Função | Permissões Chave |
| :--- | :--- | :--- |
| **`user`** | **Usuário Padrão** | Criar, ler, atualizar e excluir **suas próprias** transações. Acesso a relatórios pessoais. |
| **`admin`** | **Administrador** | Gerenciar usuários comuns (`user`), acesso a dashboards e dados de nível superior (para moderação). |
| **`master`** | **Super Administrador** | Gerenciar todos os usuários, permissão exclusiva para exclusão final de contas e ações críticas no sistema. |

### Edge Functions Críticas

O sistema de gestão de contas e notificações é suportado pelas seguintes funções *serverless* implantadas no Supabase:

* `delete-user-completely`
* `send-cancellation-email`
* `send-approval-email`
* `send-pending-approval-email`
* *(e outras funções para gerenciamento e notificação de contas)*

---

## 🚀 Como Executar o Projeto Localmente

Siga estas etapas para configurar e executar o FINZ no seu ambiente de desenvolvimento.

### 1. Configuração do Repositório

Clone o repositório para o seu ambiente local:

```bash
git clone [https://github.com/Fjailton16/FINZ-Main.git](https://github.com/Fjailton16/FINZ-Main.git)
cd FINZ-Main
