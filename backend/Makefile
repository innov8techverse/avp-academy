
.PHONY: install run run-detached build stop clean logs shell db-reset db-seed db-migrate

# Install dependencies
install:
	npm install

# Run all services (backend + postgres + redis + adminer)
run:
	docker network create avp-network 2>nul || exit 0
	docker-compose up --build

# Run in detached mode
run-detached:
	docker network create avp-network 2>nul || exit 0
	docker-compose up -d --build

# Build for production
build:
	npm run build

# Stop all services
stop:
	docker-compose down

# Clean up containers and volumes
clean:
	docker-compose down -v --remove-orphans
	docker system prune -f

# View logs
logs:
	docker-compose logs -f

# View specific service logs
logs-backend:
	docker-compose logs -f backend

logs-db:
	docker-compose logs -f postgres

# Shell into backend container
shell:
	docker-compose exec backend sh

# Database operations
db-reset:
	docker-compose exec backend npx prisma db push --force-reset

db-seed:
	docker-compose exec backend npm run db:seed

db-migrate:
	docker-compose exec backend npx prisma migrate dev

# Prisma studio
db-studio:
	docker-compose exec backend npx prisma studio
