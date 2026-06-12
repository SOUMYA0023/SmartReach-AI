.PHONY: up down build migrate seed test logs

up:
	docker compose up -d --build

down:
	docker compose down

build:
	docker compose build

migrate:
	docker compose exec crm-api alembic upgrade head

seed:
	docker compose exec ai-service python -m app.rag.seed_knowledge

test:
	pytest tests/crm -v && pytest tests/ai -v

logs:
	docker compose logs -f

restart:
	docker compose down && docker compose up -d --build
