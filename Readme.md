# 🧠 OPC UA Multi-Client Data Collector

**Backend: Node.js + TypeScript + MongoDB**  
**Frontend: React + TypeScript + Styled Components**

---
## 📘 Visão Geral

Este projeto implementa um **coletor de dados OPC UA multi-cliente** com arquitetura **Node.js + TypeScript + MongoDB + React**, projetado para ambientes industriais.  
O sistema permite a **criação dinâmica de múltiplas instâncias independentes de clientes OPC UA**, cada uma comunicando-se com diferentes servidores OPC UA na rede, armazenando leituras e telemetrias em coleções isoladas no MongoDB.

O **frontend React/TypeScript** atua como painel de monitoramento e análise, exibindo em tempo real as variáveis coletadas, o status das conexões, alertas de limite e dashboards históricos.


---

## ⚙️ Arquiterua do Sistema

┌─────────────────┐        ingest (OPC UA)        ┌──────────────────┐
│  OPC UA Servers │ ───────────────────────────▶  │  OPC UA Clients  │
└─────────────────┘                               │  (Multi-Client)   │
                                                  │  inside BACKEND  │
                                                  └─────────┬────────┘
                                                            │ write/read
                                                            ▼
                                                    ┌───────────────┐
                                                    │   MongoDB     │
                                                    └───────────────┘
                                                            ▲
                                             REST / WS      │
┌─────────────────┐   HTTPS (REST/WS)   ┌─────────┴────────┐
│    Frontend     │ ◀────────────────── │     Backend      │
│  (React/TS)     │ ───────────────────▶│  (Node/TS API)   │
└─────────────────┘                     └──────────────────┘

- Frontend ⇄ Backend: HTTP/HTTPS (REST) e, quando necessário, WebSockets.
- Backend ⇄ OPC UA: sessões/assinaturas mantidas pelos clientes OPC UA (node-opcua).
- Backend ⇄ MongoDB: escrita de telemetria e leitura para as rotas da API.

### 🔩 Backend (Node.js + TypeScript)

- Gerencia múltiplas instâncias de `OpcuaClient` através do **ClientManager**.
- Cada instância conecta-se a um endpoint OPC UA distinto.
- Coleta periódica (polling) de variáveis e escrita em MongoDB.
- Coleções dinâmicas por cliente:
  Client01_Transmiters
  Client02_Transmiters
  Client03_Transmiters

- Pipeline de agregação temporal e filtragem por mês/ano, hora inicial/final.
- Sistema de alertas (e-mail / WhatsApp) baseado em limites configurados nos arquivos `ClientXX_setuptsconfig.json`.

### 🖥️ Frontend (React + TypeScript)
- Interface de dashboards industriais com múltiplos componentes:
- **WalletBox** – KPIs agregados.  
- **HistoryBox** – histórico temporal.  
- **PieChartBalance** – relação de falhas por variável.  
- **MongoDBBox / OPCUABox / HostMetricsBox** – status de infraestrutura.  
- Estilização modular via **styled-components**.  
- Animações com **Framer Motion**.  
- Comunicação via **Axios / Fetch** com o backend.  
- Documentação completa via **JSDoc** padronizado.

---

## 🧩 Estrutura de Diretórios

├── backend/
│ ├── src/
│ │ ├── clients/ # Instâncias OPC UA (Client01, Client02, etc.)
│ │ ├── core/ # ClientManager, Device_WriteDB, alert schedulers
│ │ ├── routes/ # Rotas REST (status, telemetria, histórico)
│ │ ├── utils/ # Helpers e pipelines de agregação MongoDB
│ │ └── config/ # Setup e limites por cliente
│ ├── package.json
│ ├── tsconfig.json
│ └── .env.example
│
└── frontend/
├── src/
│ ├── components/ # UI Boxes (HistoryBox, WalletBox, OPCUABox, etc.)
│ ├── hooks/ # Contextos (auth, theme, msgbox)
│ ├── pages/ # Páginas do app (Dashboard, Login, Profile)
│ ├── services/ # API handlers e integração backend
│ └── styles/ # Themes e global styles
├── package.json
├── tsconfig.json
└── public/
└── favicon.ico

---

## 🧠 Tecnologias Principais

### Backend
| Tecnologia | Uso |
|-------------|------|
| **Node.js / TypeScript** | Core da aplicação OPC UA |
| **node-opcua** | Implementação do cliente OPC UA |
| **Express.js** | API REST entre backend ↔ frontend |
| **MongoDB / Mongoose** | Armazenamento dos dados de telemetria |
| **Nodemailer / WhatsApp API** | Alertas automáticos |
| **Winston / Morgan** | Logging e auditoria |
| **dotenv** | Configuração por ambiente |

### Frontend
| Tecnologia | Uso |
|-------------|------|
| **React + TypeScript** | Framework principal da UI |
| **styled-components** | CSS-in-JS e temas dinâmicos |
| **Framer Motion** | Animações de interface |
| **Recharts** | Visualização de dados (gráficos) |
| **Axios** | Comunicação HTTP com o backend |
| **React Router DOM** | Navegação SPA |
| **Context API** | Autenticação, tema e mensagens globais |

---

## 🚀 Instalação e Execução

### Pré-requisitos
- Node.js 18+
- MongoDB em execução local ou remoto
- NPM ou Yarn
  
1️⃣ Backend
cd backend
npm install
cp .env.example .env
# configure variáveis: mongodb_uri, Opcua_EndPoints, Email_Service, etc
npm run dev

2️⃣ Frontend
cd ../frontend
npm install
npm run dev

