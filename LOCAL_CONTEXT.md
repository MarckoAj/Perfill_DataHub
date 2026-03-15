# Project Context

## Project Name

GLPI Power BI Integration API

## Objective

This project exposes REST endpoints for Power BI to consume data from GLPI.

The API acts as a middleware layer responsible for:

- retrieving data
- transforming operational data
- exposing BI-friendly endpoints

The project is built with Node.js and Express.

---

# Architecture

The project follows a layered architecture:

routes → controllers → services → repositories → database

External integrations are placed in the integrations layer.

Transformations between raw data and BI structures must be handled by mappers.

---

# Folder Structure

src

routes  
controllers  
services  
repositories  
integrations  
mappers  
database  
jobs  
utils  

Each folder has a single responsibility.

---

# Responsibilities

Routes  
Define API endpoints.

Controllers  
Handle HTTP request and response.

Services  
Contain business logic.

Repositories  
Execute database queries.

Integrations  
Communicate with external APIs like GLPI.

Mappers  
Transform raw data into BI-friendly structures.

Jobs  
Scheduled tasks for synchronization.

---

# Power BI Endpoint

Main endpoint exposed for Power BI:

GET /api/bi/tickets

Query parameters:

startDate  
endDate  

Example:

GET /api/bi/tickets?startDate=2026-03-01&endDate=2026-03-11

The response must always be a flat JSON array suitable for BI ingestion.

---

# Data Format

Responses must follow a flat structure.

Example:

[
  {
    "ticketId": 321,
    "titulo": "Camera offline",
    "status": "Atribuido",
    "dataCriacao": "2026-03-10",
    "dataFechamento": null
  }
]

Avoid nested objects.

---

# Refactoring Instructions for Cursor

Refactor the existing project to follow the architecture described above.

Tasks:

- reorganize folders according to the structure defined in this document
- separate responsibilities into routes, controllers, services and repositories
- keep integrations isolated in the integrations layer
- ensure controllers only handle HTTP logic
- move business logic to services
- move SQL queries to repositories

Important:

The project already contains existing mapper functions.

Do NOT recreate mapping logic.

Reuse the existing mapper files and integrate them inside the services layer.

All data transformations must pass through the existing mapper implementation.

---

# Coding Guidelines

Use Node.js with Express.

Use async/await.

Avoid placing business logic inside controllers.

Keep services responsible for business rules.

Repositories must only execute database queries.

---

# Future Architecture

The API will evolve into an Integration Hub connecting multiple systems:

GLPI  
Zabbix  
AUVO  

For now, the focus is exposing BI endpoints for Power BI.

---

# Dashboard & Authentication (v1.1)

A basic visual dashboard is available at `/chamados.html`. This page allows users to view synchronized data directly without needing Power BI.
The dashboard is protected by a static login flow implemented in `/api/auth/login`.

- **Credentials**: Handled via `DASHBOARD_USER` and `DASHBOARD_PASS` environment variables.
- **Token Delivery**: On success, the API replies with `API_AUTH_TOKEN`, saved in `localStorage`.
- **Protected Routes**: Both the visual dashboard data fetch and the Power BI endpoint (`/api/bi/tickets`) are protected by a middleware that requires the `authorization: Bearer <token>` header, ensuring GLPI data is not publicly exposed.

---

# Testing Suite

The project includes an integration testing suite built with Jest and Supertest, focused on verifying the entire request lifecycle without external dependencies.
Tests are executed using `npm test`. 

**Key Test Coverage:**
1. **Authentication:** Validates the login routes, correct/incorrect credentials, and token issuance.
2. **BI Routes:** Verifies the Power BI endpoints operate correctly after mocking the database repositories, ensuring token middleware rejects unauthorized access.
3. **GLPI Integrations:** Replaces the native `fetch` client to directly simulate GLPI responses, asserting the mapping and data processing layers remain resilient.