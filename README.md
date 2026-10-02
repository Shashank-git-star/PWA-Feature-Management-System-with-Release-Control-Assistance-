# Feature Flag Management System

Manage feature flags by environment, evaluate their effective values, and control releases with environment overrides and targeting rules. FastAPI provides the API and React/Vite provides the dashboard.

## Start the full stack (development)

Requires Docker Desktop or Docker Engine with the Compose plugin.

```powershell
Copy-Item .env.example .env.docker
```

Edit `.env.docker` and replace the database password and `AUTH_TOKEN_SECRET` with separate random values. Generate each value with:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Then, from the repository root:

```powershell
docker compose --env-file .env.docker up --build
```

Open the dashboard at **http://localhost:5173** and the interactive API docs at **http://localhost:8000/docs**. The Compose workflow runs PostgreSQL, Redis, FastAPI, and Vite with source hot reload. PostgreSQL data is stored in the `postgres_data` volume; Redis is a disposable cache.

Stop the services with `Ctrl+C`, or run:

```powershell
docker compose --env-file .env.docker down
```

To also delete the database and all stored data, run `docker compose --env-file .env.docker down --volumes`.

## First administrator

Sign up through the dashboard or `POST /auth/signup`; new accounts are regular users. To grant administrator access to a trusted account, run this from the repository root, replacing the email with that account:

```powershell
docker compose --env-file .env.docker exec postgres psql -U infy_app -d infy_project -c "UPDATE users SET is_admin = TRUE WHERE email = 'admin@example.com';"
```

Afterward, sign in again and use the dashboard normally. For Swagger, choose **Authorize** and paste the login response's raw `access_token`.

## Configuration and deployment notes

- `.env.docker` is ignored by Git; never commit real passwords or signing keys.
- If ports `5173`, `8000`, or `5433` are already in use, stop the conflicting local service or change the corresponding port in `docker-compose.yml`/`.env.docker`.
- The Compose file is intended for local development, not direct public deployment. Before production, disable Vite/Uvicorn reload, serve the frontend with a production web server, use managed secrets, and put the services behind HTTPS.
- The current backend creates tables at startup with SQLAlchemy `create_all`; plan and apply versioned database migrations before evolving a production schema.
