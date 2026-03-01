# Speak Sense AI

## Environment setup

This project now reads API/secret configuration from environment files:

- `server/.env` (Node API)
- `ai-service/.env` (FastAPI service)

Template files are available:

- `server/.env.example`
- `ai-service/.env.example`

### Server required values

- `MONGO_URI`
- `JWT_SECRET`
- `PORT` (optional)

### Optional shared keys

- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_DB`

### Frontend optional flags

- `REACT_APP_EXPERIMENTAL_PROMPTS=true` enables experimental interview prompt mode in the client.
- Local override for testing: set `localStorage` key `ff.experimentalPrompts` to `true` or `false`.

## Run with Docker Compose

```bash
docker-compose up --build
```

## Notes

- Current backend database remains MongoDB.
- Postgres credentials are stored for future integration and are not yet used by server routes.
