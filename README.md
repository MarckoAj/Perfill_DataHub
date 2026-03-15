# Perfill BI Integration (GLPI)

Esta API funciona como um middleware estratégico entre o sistema **GLPI** (Gestão de chamados) e ferramentas de **Business Intelligence** (como Power BI) ou Dashboards customizados.

Ela extrai e padroniza dados brutos, simplifica as consultas, expõe rotas seguras e de alta performance, e mapeia todas as regras de negócio em um único local, protegendo o banco original e sistemas de consumo.

## 🚀 Tecnologias

- **Node.js** com **Express**
- **MySQL2** (para banco de staging local)
- **Jest** e **Supertest** (Testes automatizados e de integração)
- **CORS**, **Dotenv**, etc.

## 📦 Arquitetura

Este projeto foi reestruturado seguindo princípios sólidos, com separação de responsabilidades nas seguintes camadas:

```text
src/
├── clients/      # Integrações com sistemas externos (Ex: GLPI Client API)
├── config/       # Configuração global da aplicação (Express)
├── controllers/  # Recebe requisições HTTP, chama services, envia respostas HTTP
├── mappers/      # Padroniza dados recebidos do GLPI para o formato BI ou BD
├── middlewares/  # Camada de interceptação (autenticação, logs, manipulação de erros)
├── repositories/ # Transações diretas e focadas com o banco de dados da aplicação
├── routes/       # Pontos de entrada da API (/api/bi, /api/auth)
├── service/      # Regras de Negócio, orquestração entre repositories e clients
└── utils/        # Classes auxiliares, como Construtores de URL (GlpiUrlBuilder)
```

## 🔐 Autenticação e Segurança

Há uma rota pública para a página inicial, mas os acessos aos endpoints de negócio (ex: Power BI e Dashboard de Chamados) estão protegidos através de **Tokens estáticos**.
Estes tokens devem ser configurados no arquivo `.env` para proteção. 

## ⚙️ Como executar localmente

1. Faça um `git clone` deste repositório
2. Rode `npm install` no diretório principal.
3. Configure o arquivo `.env` baseado no `.env.example` preenchendo:
   - Suas credenciais da API do GLPI.
   - Suas credenciais do Banco do projeto (Aiven, local, etc).
   - O usuário/senha e Token secreto para as rotas do Painel de BI.
4. Execute `npm run dev` (com nodemon) ou `npm start`.

A aplicação escutará por padrão na porta `3000`.

## 🧪 Testes de Integração

A aplicação conta com um suite completo na pasta `__tests__/`. Usamos o **Jest** configurado com **Supertest** para cobrir as rotas de ponta a ponta ("mockando" as dependências externas de DB e GLPI).

Para rodá-los, utilize o comando:

```bash
npm test
```
