# Vegshop Docker Setup

This project includes a `docker-compose.yml` file that starts the Node.js backend together with MongoDB and PostgreSQL.

## Prerequisites
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

## Usage
1. Copy `backend/.env.example` to `backend/.env` and adjust values as needed.
2. Run `docker-compose up --build`.
3. The API will be reachable at <http://localhost:4000> using both databases.

MongoDB data is stored in the `mongo-data` volume and PostgreSQL data in `postgres-data`.
