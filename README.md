# Feature Flag Mangement System

It is a web-based feature flag management system. It helps teams release features gradually, target specific users or groups, and control behavior by environment—without needing to redeploy the application for every release change.

## What it does

- Create and manage feature flags, environments, and environment overrides.
- Evaluate a flag for a user or group, using targeting rules and percentage rollouts.
- Manage users and groups, with bearer-token login and admin-only configuration changes.
- Review audit logs and analytics to understand configuration changes and flag evaluations.
- Explore the built-in SDK documentation and API reference.

## How it fits together

```text
┌────────────────────────┐       HTTP / bearer token       ┌─────────────────────┐
│ React + Vite dashboard │ ───────────────────────────────> │ FastAPI application │
└────────────────────────┘                                  └──────────┬──────────┘
                                                                      │
                                                ┌─────────────────────┴────────────────┐
                                                │                                      │
                                       ┌────────▼────────┐                   ┌────────▼────────┐
                                       │   PostgreSQL    │                   │      Redis      │
                                       │ flags and audit │                   │ evaluation cache│
                                       └─────────────────┘                   └─────────────────┘
```

## Run locally with Docker Compose

Requirements: Docker Desktop (or Docker Engine) with the Compose plugin.

1. From the project root, create a local environment file:

   ```powershell
   Copy-Item .env.example .env.docker
   ```

2. Edit `.env.docker` and set a strong database password and `AUTH_TOKEN_SECRET`. Keep this file private; it is excluded from Git.
3. Start the application:

   ```powershell
   docker compose --env-file .env.docker up -d --build
   ```

   For later starts, use `docker compose --env-file .env.docker up -d`—`--build` is only needed after image or dependency changes.

4. Open the dashboard at **http://localhost:5173**. The API is at **http://localhost:8000**, with interactive Swagger docs at **http://localhost:8000/docs**.

Sign up in the dashboard to create an account. New accounts are regular users; grant administrator access only to trusted accounts. For example, from the project root, replace the email below with the account to promote:

```powershell
docker compose --env-file .env.docker exec postgres psql -U infy_app -d infy_project -c "UPDATE users SET is_admin = TRUE WHERE email = 'admin@example.com';"
```

## Technology

- **Frontend:** React, Vite
- **Backend:** Python, FastAPI, SQLAlchemy
- **Data and cache:** PostgreSQL, Redis
- **Local orchestration:** Docker Compose

> The included Compose setup is for local development. Prepare production settings separately: use HTTPS, managed secrets, production frontend serving, and a versioned database migration process.
