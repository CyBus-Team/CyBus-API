## Environment Setup

All database operations and testing workflows are designed to run inside Docker.  
Make sure Docker is running before using any `db:*` or `test:*` scripts.

Environments are configured using `.env` and `.env.test` files.

### Example `.env`

```dotenv
# General settings
AUTOCOMPLETE_USER_AGENT='CyBusAPI/1.0 (autocompletion service)'
ROUTES_PARSE_CRON="0 3 * * *" # Every day at 3 AM
STOPS_PARSE_CRON="0 4 * * *" # Every day at 4 AM
GTFS_PARSE_CRON="0 5 * * *" # Every day at 5 AM
BUSES_PARSE_CRON="*/1 * * * *" # Every minute
OSM_PBF_PARSE_CRON="30 3 * * 1" # Every Monday at 3:30 AM
OTP_GTFS_MERGE_CRON="35 3 * * 1" # Every Monday at 3:35 AM

# Dev DB
POSTGRES_USER='postgres'
POSTGRES_PASSWORD='123'
POSTGRES_DB='cybus'

# Test DB
POSTGRES_TEST_USER='cybus_test_user'
POSTGRES_TEST_PASSWORD='123'
POSTGRES_TEST_DB='cybus_test'

# Connection URL
DATABASE_URL='postgresql://postgres:123@localhost:5434/cybus?schema=public'
```

### Example `.env.test`

```dotenv
# E2E Connection URL
DATABASE_URL="postgresql://cybus_test_user:123@localhost:5435/cybus_test?schema=public"
```

## Project setup

```bash
$ yarn install
```

## Initialize data

After installing dependencies and setting up the database, initialize required data files:

```bash
$ yarn init:data
```

## Compile and run the project

```bash
# before starting the dev server, run migrations
$ yarn db:dev:restart

# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Run tests

```bash
# unit tests
$ yarn run test

# e2e tests (uses the test database)
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ yarn install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.
