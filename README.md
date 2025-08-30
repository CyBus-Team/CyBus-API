## Environment Setup

All database operations and testing workflows are designed to run inside Docker.  
Make sure Docker is running before using any `db:*` or `test:*` scripts.

Environments are configured using `.env` and `.env.test` files.

### Example `.env`

```dotenv
# General settings
AUTOCOMPLETE_USER_AGENT='CyBusAPI/1.0 (test@gmail.com)'
ROUTES_PARSE_CRON="0 9 1 * *" # Monthly on the 1st at 12:00 PM Cyprus time
STOPS_PARSE_CRON="0 9 1 * *"  # Monthly on the 1st at 12:00 PM Cyprus time
GTFS_PARSE_CRON="0 9 1 * *"   # Monthly on the 1st at 12:00 PM Cyprus time
BUSES_PARSE_CRON="*/1 * * * *" # Every minute
OSM_PBF_PARSE_CRON="0 9 1 * *" # Monthly on the 1st at 12:00 PM Cyprus time
OTP_GTFS_MERGE_CRON="0 9 1 * *" # Monthly on the 1st at 12:00 PM Cyprus time
OTP_BASE_URL='http://localhost:8080' # Base URL for OTP GraphQL API

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

## License
Licensed under the Apache License, Version 2.0.  
See [LICENSE](./LICENSE) for details.
