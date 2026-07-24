# Genius Finance Mobile — Design de Migração

## 1. Escopo

Migrar o sistema Web **Genius Finance** (React Router v7 + Firebase + Tailwind) para um aplicativo mobile nativo usando **Expo (React Native)** com **Gluestack UI v5**, mantendo 100% de paridade funcional.

## 2. Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Framework Mobile | Expo SDK 52+ |
| Roteamento | Expo Router (file-based) |
| UI | Gluestack UI v5 |
| Linguagem | TypeScript |
| Backend | Firebase Auth + Firestore (mesmo do web) |
| API Server-side | Endpoints Node existentes (sub, IA, admin) |
| Gráficos | victory-native |
| Calendário | react-native-calendars |
| Kanban drag | react-native-draggable-flatlist |
| Ícones | lucide-react-native |
| QR Code | react-native-qrcode-svg |
| Estado | React Context (mesmo pattern do web) |

## 3. Navegação Mobile

### Fluxo Principal
```
Splash (verifica auth) 
  → se não logado: Login 
  → se logado: Tabs + Drawer
```

### Estrutura

```
Root Layout (_layout.tsx)
├── Gluestack UIProvider
├── FinanceProvider (Context)
├── (public) Stack
│   └── login.tsx
└── (app) Tabs + Drawer
    ├── Bottom Tabs
    │   ├── Início → Dashboard
    │   ├── Financeiro → Stack: Transações | DRE | Fixos Mensais | Calendário | Fechamento Mensal
    │   ├── Comercial → Stack: Leads | Vendas | Metas | Relatórios
    │   └── Projetos → Stack: Kanban | Tipos de Serviço
    └── Drawer
        ├── Orçamento
        ├── Limites de Gastos
        ├── Analista IA
        ├── Relatórios Anuais
        ├── Assinatura
        ├── Configurações (Contas, Membros, Convites)
        ├── Reportar Problema
        ├── Admin (Planos | Assinaturas | Reports) — só se superadmin
        └── Sair
```

## 4. Telas e Funcionalidades

### Públicas
| Tela | Funcionalidade |
|------|---------------|
| Login | Google OAuth + Email/Senha, aceite de termos, reset de senha |

### Autenticadas

#### Início (Dashboard)
- Cards de saldo, receitas, despesas (com opção de ocultar valores)
- Alertas de limites, fechamento pendente
- Gráfico dereceitas vs despesas (últimos 6 meses)
- Últimas transações (lista resumida)

#### Financeiro
- **Transações**: FlatList com CRUD, parcelamento, transações fixas, toggle PENDING/PAID
- **DRE**: Tabela de demonstrativo de resultados (receitas, custos, despesas, totais)
- **Fixos Mensais**: Lista de despesas recorrentes
- **Calendário**: Calendário mensal com indicadores de fluxo de caixa
- **Fechamento Mensal**: Status OPEN/CLOSED, abrir/fechar mês

#### Comercial
- **Leads**: CRUD de leads com funil por status (options configuráveis)
- **Vendas**: Metas mensais por canal/vendedor
- **Metas**: Metas financeiras com progresso

#### Projetos
- **Kanban**: Board com colunas configuráveis, drag & drop, tarefas por projeto
- **Tipos de Serviço**: CRUD com etapas e campos personalizados

#### Drawer
- **Orçamento**: Planejamento por categoria/mês vs realizado
- **Limites de Gastos**: Limites por categoria
- **Analista IA**: Chat com IA
- **Relatórios Anuais**: Gráficos e totais anuais
- **Assinatura**: Status do plano, upgrade, PIX
- **Configurações**: Perfil, multi-contas (PESSOAL/BUSINESS), membros, convites
- **Reportar Problema**: Formulário
- **Admin**: Planos, assinaturas, reports (superadmin)

## 5. Estado e Dados

### State Management
- `FinanceProvider` (React Context) — mesmo pattern do web em `useFinance.tsx`
- Listeners Firestore em tempo real via `useCollectionListener`
- ActiveScope (PERSONAL / BUSINESS) com persistência local

### Entidades Firestore
`transactions`, `categories`, `budgets`, `sales-targets`, `tags`, `goals`, `spending-limits`, `leads`, `lead-options`, `service-types`, `projects`, `tasks`, `project-kanban-settings`, `monthly-closings`, `accounts`, `members`, `invites`, `memberships`

### API Client
- `apiFetch` para endpoints server-side (assinatura, IA, admin, reports)
- Bearer token do Firebase Auth

## 6. Componentização Gluestack UI v5

| Propósito | Componente Gluestack |
|-----------|---------------------|
| Layout base | Box, VStack, HStack |
| Botões | Button (solid, outline, ghost) |
| Inputs | Input, InputField |
| Formulários | FormControl, Select, Checkbox |
| Modais | Actionsheet (bottom sheet) |
| Cards | Card |
| Listas | FlatList + Card |
| Loading | Spinner |
| Feedback | Toast |
| Navegação | Tabs, Menu |
| Dark/Light | useColorMode do Gluestack |

## 7. Dependências

```json
{
  "expo": "~52.0.0",
  "expo-router": "~4.0.0",
  "firebase": "^12.0.0",
  "@gluestack-ui/themed": "latest",
  "@gluestack-ui/config": "latest",
  "victory-native": "^41.0.0",
  "react-native-calendars": "^1.0.0",
  "react-native-draggable-flatlist": "^4.0.0",
  "lucide-react-native": "^0.546.0",
  "date-fns": "^4.1.0",
  "react-native-qrcode-svg": "^6.0.0",
  "@react-native-async-storage/async-storage": "^2.0.0"
}
```

## 8. Regras de Negócio Preservadas

1. Multi-contexto PESSOAL ↔ BUSINESS com troca instantânea
2. Trial 7 dias com contagem regressiva e modal de upgrade
3. Parcelamento de transações (N parcelas mensais)
4. Transações fixas recorrentes (com data fim)
5. DRE automático a partir das categorias (RECEITA / CUSTOS / DESPESAS)
6. Fechamento mensal com cálculo de saldo inicial/final
7. Kanban com colunas customizáveis e tarefas por projeto
8. Permissões por papel (owner/admin/member)
9. Orçamento vs realizado por categoria/mês
10. Limites de gastos com alertas no dashboard

## 9. Estrutura de Pastas

```
financemobile/
├── app/
│   ├── _layout.tsx
│   ├── (public)/
│   │   └── login.tsx
│   └── (app)/
│       ├── _layout.tsx
│       ├── (tabs)/
│       │   ├── _layout.tsx
│       │   ├── index.tsx              # Dashboard
│       │   ├── finance/              # Stack
│       │   ├── commercial/           # Stack
│       │   └── projects/             # Stack
│       ├── drawer/                   # Drawer screens
│       └── modals/                   # Full-screen modals
├── src/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── lib/
│   ├── types/
│   └── constants/
```

## 10. Não Escopo (fora desta migração)

- Landing page de marketing (substituída por Splash + Login)
- Migração de APIs server-side para Firebase Functions (manter API Node existente)
