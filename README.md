# Compiler Bot

A beginner-friendly FastAPI project that runs Python code, stores execution history in PostgreSQL, and generates a local Ollama explanation for each run.

## Current Features

- FastAPI backend with versioned API routes
- PostgreSQL-backed execution history
- Python code execution with stdout, stderr, and exit code capture
- Ollama-based local explanation generation
- Plain HTML/CSS/JavaScript sandbox UI served by FastAPI

## Project Structure

```text
project/
  app/
    api/
    core/
    db/
    executors/
    models/
    schemas/
    services/
    static/
    main.py
  .env
  requirements.txt
```

## Local Setup

1. Create and activate a virtual environment.

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

2. Install dependencies.

```powershell
python -m pip install -r requirements.txt
```

3. Make sure PostgreSQL is running and create the `compiler_bot` database.

4. Make sure Ollama is installed and pull a model.

```powershell
ollama pull llama3.2
```

5. Create a `.env` file in the project root.

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/compiler_bot
APP_NAME=Compiler Bot
DEBUG=True
OLLAMA_MODEL=llama3.2
API_V1_PREFIX=/api/v1
CORS_ORIGINS=*
```

6. If your `executions` table already exists, add the explanation column once:

```sql
ALTER TABLE executions
ADD COLUMN llm_explanation TEXT;
```

7. Run the app.

```powershell
python -m uvicorn app.main:app --reload
```

## Local URLs

- Sandbox UI: `http://127.0.0.1:8000/`
- Swagger Docs: `http://127.0.0.1:8000/docs`
- Health Check: `http://127.0.0.1:8000/health`

## API Example

Send a `POST` request to:

```text
/api/v1/executions/
```

Example request body:

```json
{
  "language": "python",
  "code": "print('Hello from Compiler Bot')",
  "stdin_input": ""
}
```

## Free Deployment Reality Check

This project is ready for local development and a small free beta, but the current execution approach is not production-safe for untrusted public code execution.

Before a public production launch, the next major steps should be:

- sandbox code execution more safely
- add API authentication
- restrict CORS
- add structured logging
- add migrations with Alembic
- move secrets and environment config into deployment settings

## Free Beta Deployment Path

The most practical free beta path is:

- host the FastAPI backend on Render
- host PostgreSQL on Neon
- use OpenRouter with each user's own API key for hosted AI
- keep Ollama as the local-first option for users running the app on their own machine

### Why this split helps

- Ollama is great locally, but it is not a good fit for a free shared cloud deployment
- OpenRouter works better for a hosted beta because each user can bring their own key
- Neon gives you a free hosted PostgreSQL option for development and beta use

### Render deploy steps

1. Push this project to GitHub
2. Create a free PostgreSQL database on Neon
3. Create a new Render Web Service from the repo
4. Render can use the included `render.yaml`
5. Add these environment variables in Render:

```env
DATABASE_URL=your_neon_postgres_url
APP_NAME=Compiler Bot
DEBUG=False
OLLAMA_MODEL=llama3.2
API_V1_PREFIX=/api/v1
CORS_ORIGINS=*
```

### Hosted AI recommendation

For a deployed cloud version:

- prefer `OpenRouter` in the UI
- let users enter their own OpenRouter key
- do not depend on Ollama for your shared cloud deployment

For a local version on a user's machine:

- choose `Ollama`
- use a local model like `llama3.2`

## Suggested Next Steps

1. Add a safer execution sandbox layer
2. Add a VS Code extension or local desktop client
3. Add authentication and per-user usage tracking
4. Prepare a free beta deployment using a hosted Postgres and a lightweight API host
