# Dashboard — Sistema de Gestão de Incidentes e Inteligência Operacional

Projeto acadêmico desenvolvido para a disciplina de Análise e Desenvolvimento
de Sistemas (ADS), construído com qualidade técnica de uma aplicação real:
executável localmente, com banco de dados normalizado, API REST autenticada
e interface web funcional.

## Sumário

- [Problema](#problema)
- [Objetivo](#objetivo)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [Regras de negócio implementadas](#regras-de-negócio-implementadas)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Requisitos](#requisitos)
- [Instalação e execução (do zero)](#instalação-e-execução-do-zero)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Usuários de demonstração](#usuários-de-demonstração)
- [Scripts disponíveis](#scripts-disponíveis)
- [Funcionalidades futuras](#funcionalidades-futuras)

## Problema

Equipes de Customer Experience (CX) costumam registrar ocorrências de forma
fragmentada — planilhas, chats, e-mails — o que dificulta identificar quando
vários clientes estão sendo afetados pelo **mesmo problema operacional**
(um atraso de transportadora, uma falha no checkout, um lote de produtos
faltantes). Sem agrupar essas ocorrências, a empresa trata cada reclamação
isoladamente e demora a perceber padrões e recorrências.

## Objetivo

Transformar registros individuais de Customer Experience em dados
estruturados, seguindo o fluxo:

```
CASO → INCIDENTE → IMPACTO → INDICADOR → RECORRÊNCIA
```

O sistema **não tenta resolver** problemas operacionais automaticamente —
ele organiza e transforma dados brutos em informação: permite registrar
casos, categorizá-los, agrupá-los em incidentes quando há uma causa comum,
acompanhar o tratamento de cada um e apresentar indicadores derivados do
banco de dados real.

## Funcionalidades

- **Autenticação** com e-mail/senha e token JWT.
- **Dashboard** com cards de indicadores (incidentes, casos por status,
  casos críticos, clientes afetados, recontatos) e 4 gráficos (casos por
  categoria, casos por status, incidentes por prioridade, evolução de
  casos nos últimos 6 meses) — todos calculados a partir do banco.
- **Gestão de Casos**: listagem com busca, filtro por status/prioridade e
  paginação; cadastro; edição; exclusão (com confirmação); tela de
  detalhes com timeline de interações.
- **Gestão de Incidentes**: listagem com busca e filtros; cadastro;
  edição; tela de detalhes com indicadores do incidente, casos
  relacionados e timeline de atualizações; atalho para vincular um novo
  caso diretamente a partir do incidente.
- **Seed de demonstração**: popula o banco com usuários, incidentes,
  casos e interações fictícios, para o sistema ficar pronto para
  apresentação.

## Tecnologias

| Camada | Tecnologia | Observação |
|---|---|---|
| Frontend | React + Vite | SPA em JavaScript puro, sem TypeScript |
| Estilo | CSS puro | Sem framework de CSS, paleta própria (Azul Tecnológico e Ciano) |
| Gráficos | Chart.js + react-chartjs-2 | 4 gráficos no dashboard |
| Backend | Node.js + Express | API REST |
| Acesso ao banco | **`pg` (driver nativo), SEM ORM** | Ver justificativa abaixo |
| Banco de dados | PostgreSQL | Schema normalizado, 7 tabelas |
| Autenticação | JWT + bcrypt | Token assinado, senha nunca em texto puro |

### Por que SQL puro, sem ORM?

Esta é uma decisão técnica deliberada, não uma limitação. Um ORM
(Sequelize, Prisma etc.) esconderia o modelo relacional e as regras de
negócio atrás de abstrações. Escrevendo o SQL manualmente — em
`database/schema.sql` e nas *queries* de cada `service` do backend — o
modelo de dados, os `JOIN`s, as regras de integridade e os cálculos dos
indicadores do dashboard ficam **explícitos e auditáveis**, o que facilita
tanto a manutenção quanto a defesa acadêmica do projeto: é possível abrir
qualquer `service` e mostrar exatamente qual consulta gera qual número.

## Arquitetura

```
React (SPA)  ──HTTP/JSON──►  REST API (Express)  ──SQL──►  PostgreSQL
     ▲                              │
     └──────── JWT no header ───────┘
```

- O frontend nunca acessa o banco diretamente — toda comunicação passa
  pela API REST.
- Toda rota de dados (casos, incidentes, interações, atualizações,
  dashboard, categorias, usuários) exige um token JWT válido no header
  `Authorization: Bearer <token>`.
- Regras de integridade críticas (ex.: não vincular caso a incidente já
  encerrado) são garantidas **em duas camadas**: um *trigger* no
  PostgreSQL (última linha de defesa) e uma validação no backend que
  traduz o erro do banco em uma mensagem amigável para o usuário.

## Regras de negócio implementadas

| Regra | Descrição | Onde está implementada |
|---|---|---|
| RN01–RN03 | Todo caso tem categoria, status e prioridade | `CHECK`/`NOT NULL` no schema + validadores do backend |
| RN04–RN05 | Caso pode pertencer a um incidente; incidente pode ter vários casos | FK opcional `casos.incidente_id` |
| RN06–RN07 | Todo incidente tem responsável e status | `NOT NULL`/`CHECK` no schema |
| RN08 | Incidente pode ter várias atualizações | FK `atualizacoes_incidente.incidente_id` |
| RN09 | Caso resolvido não permanece "Em tratativa" | Estrutural — um único campo `status` por caso |
| RN10 | Incidente encerrado não recebe novos casos sem reabertura | *Trigger* `trg_casos_valida_incidente_encerrado` no banco |
| RN11 | Quantidade de casos por incidente é sempre calculada | `COUNT()`/subselect — nunca uma coluna armazenada |
| RN12 | Indicadores do dashboard vêm do banco real | `GET /api/dashboard` — todas as *queries* leem dados reais |

## Estrutura de pastas

```
gestão-de-incidentes/
├── database/
│   └── schema.sql              # Schema completo + dados de referência (categorias/setores)
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── config/db.js        # Pool de conexão PostgreSQL
│   │   ├── routes/             # Definição dos endpoints REST
│   │   ├── controllers/        # Tratamento de requisição/resposta
│   │   ├── services/           # Regras de negócio e queries SQL
│   │   ├── validators/         # Validação de payloads (express-validator)
│   │   ├── middlewares/        # Autenticação JWT e tratamento de erros
│   │   └── database/
│   │       ├── seedAdmin.js     # Cria só o usuário administrador
│   │       └── seed.js          # Seed completo de demonstração
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/               # Login, Dashboard, Casos/, Incidentes/
│   │   ├── components/          # Badge, CardIndicador, Paginacao, etc.
│   │   ├── layouts/             # AppLayout (sidebar), ProtectedRoute
│   │   ├── contexts/            # AuthContext, ToastContext
│   │   ├── hooks/                # useAuth, useToast
│   │   ├── services/            # Camada de comunicação com a API (axios)
│   │   ├── utils/                # Constantes, formatadores, setup do Chart.js
│   │   └── styles/               # CSS global e de componentes
│   ├── .env.example
│   └── package.json
├── .gitignore
└── README.md
```

## Requisitos

- **Node.js** 18 ou superior e **npm**
- **PostgreSQL** 14 ou superior (desenvolvido e testado na versão 16)

## Instalação e execução (do zero)

### 1. Banco de dados

```bash
# Cria o banco (ajuste usuário/senha conforme seu ambiente local)
createdb Dashboard de Gestão de Incidentes em CX

# Aplica o schema — cria as 7 tabelas, triggers, índices e insere
# categorias/setores (dados de referência fixos do sistema)
psql -d Dashboard de Gestão de Incidentes em CX -f database/schema.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edite o .env se seu PostgreSQL tiver usuário/senha/porta diferentes do padrão

npm install

# Popula o banco com dados de demonstração completos (recomendado):
# usuários, incidentes, casos e interações fictícios.
npm run seed

npm run dev   # inicia a API em http://localhost:3001
```

Se preferir apenas um usuário para testar login, sem os dados fictícios
completos, use `npm run seed:admin` no lugar de `npm run seed`.

### 3. Frontend

Em um novo terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev   # inicia a interface em http://localhost:5173
```

Acesse `http://localhost:5173` no navegador e faça login com uma das
credenciais da seção abaixo.

## Variáveis de ambiente

### `backend/.env`

| Variável | Descrição | Exemplo |
|---|---|---|
| `DB_HOST` | Host do PostgreSQL | `localhost` |
| `DB_PORT` | Porta do PostgreSQL | `5432` |
| `DB_NAME` | Nome do banco | `cx_intelligence` |
| `DB_USER` | Usuário do banco | `postgres` |
| `DB_PASSWORD` | Senha do banco | `postgres` |
| `PORT` | Porta em que a API sobe | `3001` |
| `JWT_SECRET` | Segredo usado para assinar os tokens JWT | *(gere um valor aleatório)* |
| `JWT_EXPIRES_IN` | Validade do token | `8h` |

### `frontend/.env`

| Variável | Descrição | Exemplo |
|---|---|---|
| `VITE_API_URL` | URL base da API backend | `http://localhost:3001/api` |

> Nenhum arquivo `.env` é versionado (veja `.gitignore`) — sempre copie o
> `.env.example` correspondente antes de rodar o projeto.

## Usuários de demonstração

Criados pelo script `npm run seed` (ou apenas o administrador, por
`npm run seed:admin`):

| Papel | E-mail | Senha |
|---|---|---|
| Administrador | `admin@cxintelligence.com` | `admin123` |
| Analista | `fernanda.souza@cxintelligence.com` | `analista123` |
| Analista | `marcos.lima@cxintelligence.com` | `analista123` |
| Analista | `juliana.alves@cxintelligence.com` | `analista123` |

> O MVP não implementa um sistema de permissões complexo — o campo
> `perfil` (Administrador/Analista) existe no modelo de dados, mas hoje
> todo usuário autenticado tem acesso às mesmas funcionalidades.

## Scripts disponíveis

### Backend (`backend/package.json`)

| Script | Descrição |
|---|---|
| `npm run dev` | Inicia a API com reinício automático (nodemon) |
| `npm start` | Inicia a API em modo normal |
| `npm run seed` | **Apaga** casos/incidentes/interações/atualizações existentes e recria dados de demonstração completos (usuários/categorias/setores são preservados) |
| `npm run seed:admin` | Cria apenas o usuário administrador de teste, sem tocar em nenhum outro dado |

### Frontend (`frontend/package.json`)

| Script | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento do Vite |
| `npm run build` | Gera o build de produção em `dist/` |
| `npm run preview` | Serve localmente o build de produção, para testá-lo |

## Funcionalidades futuras

Fora do escopo deste MVP, mas viáveis como evolução do projeto:

- Inteligência artificial / machine learning para categorização automática
- Análise de sentimento nas interações com o cliente
- Análise preditiva de recorrência de incidentes
- Cálculo automático de horas de retrabalho
- Integrações externas (Shopify, Intelipost, Zendesk)
- Exportação de indicadores para Power BI
- Automações externas e notificações avançadas (e-mail/push)
- Sistema de permissões mais granular por perfil de usuário
- Testes automatizados formais (ex.: Jest + Supertest no backend)
- Suporte a múltiplos setores vinculados a interações/atualizações
  (a tabela `setores` já existe no modelo, mas está desvinculada no MVP —
  ver decisão registrada no `schema.sql`)
