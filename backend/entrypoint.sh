
#!/bin/sh

echo "Waiting for database..."
while ! nc -z postgres 5432; do
  sleep 1
done
echo "Database is ready!"

echo "Generating Prisma client..."
npx prisma generate

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Building TypeScript..."
npm run build

echo "Running database seed..."
npm run db:seed || echo "Seed failed, continuing..."

echo "Starting application..."
exec "$@"
