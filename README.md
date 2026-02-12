# Book Review App

Next.js frontend + Node.js microservices + MySQL for managing books and reviews.

## Architecture

- Frontend: Next.js 15 (Pages Router), React 19, Bootstrap/react-bootstrap
- `auth-service` (port `4001`): signup/login/me with JWT + bcrypt
- `books-service` (port `4002`): books + reviews REST API
- MySQL 8 with schema bootstrap via `infra/mysql/init.sql`
- phpMyAdmin for DB access

## Environment

Create `.env.local` in repo root:

```env
NEXT_PUBLIC_AUTH_BASE_URL=http://localhost:4001
NEXT_PUBLIC_BOOKS_BASE_URL=http://localhost:4002
```

Service env vars:

- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`
- `JWT_SECRET`
- `PORT`

## Local Development (XAMPP MySQL + phpMyAdmin)

1. Start MySQL in XAMPP.
2. Open phpMyAdmin from XAMPP and run SQL in `infra/mysql/init.sql`.
3. Start auth service:

```bash
cd services/auth-service
npm install
set DB_HOST=127.0.0.1
set DB_USER=root
set DB_PASSWORD=
set DB_NAME=book_review
set DB_PORT=3306
set JWT_SECRET=supersecretjwt
set PORT=4001
npm run dev
```

4. Start books service (new terminal):

```bash
cd services/books-service
npm install
set DB_HOST=127.0.0.1
set DB_USER=root
set DB_PASSWORD=
set DB_NAME=book_review
set DB_PORT=3306
set JWT_SECRET=supersecretjwt
set PORT=4002
npm run dev
```

5. Start frontend (new terminal):

```bash
npm install
npm run dev
```

6. Open app at `http://localhost:3000`.

## Local Development (Docker Compose + phpMyAdmin container)

1. From repo root:

```bash
docker compose up --build
```

2. Open services:
- Frontend: `http://localhost:3000`
- Auth health: `http://localhost:4001/health`
- Books health: `http://localhost:4002/health`
- phpMyAdmin: `http://localhost:8080`

Default compose DB credentials:
- Host: `mysql`
- User: `root`
- Password: `rootpassword`
- Database: `book_review`

## API Summary

Auth service:
- `POST /auth/signup`
- `POST /auth/login`
- `GET /auth/me`
- `GET /health`

Books service (JWT required):
- `GET /books`
- `POST /books`
- `GET /books/:id`
- `POST /books/:id/reviews`
- `PUT /books/:id`
- `DELETE /books/:id`
- `GET /health`

## Jenkins

`Jenkinsfile` includes stages for:
- frontend install/lint/build
- service dependency install
- docker image build/tag (`GIT_COMMIT` + `latest`)
- push to placeholder registry
- deploy template via `docker compose up`
