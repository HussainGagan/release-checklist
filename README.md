# Release Checklist Tool

Simple assignment project for managing software release checklists.

## Tech Stack

- Next.js (App Router, TypeScript)
- GraphQL API (GraphQL Yoga)
- PostgreSQL + Drizzle ORM

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Create local env file:

```bash
cp .env.example .env
```

3. Set `DATABASE_URL` in `.env`.

4. Push schema to database:

```bash
npm run db:push
```

5. Start dev server:

```bash
npm run dev
```

6. Open `http://localhost:3000`.

## Docker (App + DB)

Run the full stack with Docker Compose:

```bash
docker compose up --build
```

Services started:

- `db`: PostgreSQL 16 on `localhost:5432`
- `migrate`: one-off Drizzle schema sync (`npm run db:push`)
- `app`: Next.js app on `http://localhost:3000`

Stop services:

```bash
docker compose down
```

Stop and remove database volume:

```bash
docker compose down -v
```

## Database

Current schema includes one table: `releases`.

Columns:

- `id` (serial primary key)
- `name` (varchar, required)
- `due_date` (timestamp with timezone, required)
- `additional_info` (text, optional)
- `completed_step_ids` (text array of stable step IDs, required, default empty)
- `created_at` (timestamp with timezone)
- `updated_at` (timestamp with timezone)

## API

Endpoint:

- `GET /api/graphql` (GraphiQL in development)
- `POST /api/graphql`

Query operations:

- `releaseSteps`
- `releases`
- `release(id: ID!)`

Mutation operations:

- `createRelease(name: String!, dueDate: String!, additionalInfo: String)`
- `setReleaseStep(releaseId: ID!, stepId: String!, checked: Boolean!)`
- `updateReleaseInfo(releaseId: ID!, additionalInfo: String)`
- `deleteRelease(releaseId: ID!)`
