# ---- Base with Node + Java + tools ------------------------------------------
FROM node:20-alpine AS base
RUN apk add --no-cache openjdk21-jre-headless caddy supervisor bash curl

# ---- Build NestJS ------------------------------------------------------------
FROM base AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY . .

# Generate files before build
RUN npx ts-node scripts/init.ts

# Build the project
RUN npm run build

# ---- OTP image ---------------------------------------------------------------
FROM docker.io/opentripplanner/opentripplanner@sha256:2ac19ae5746cf1962c2611823f57803d2d928dbef4b2b7ead7d485fac40c4f67 AS otpimage

# ---- Runtime: Caddy reverse-proxy + NestJS + OTP (via supervisord) ----------
FROM base AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV NEST_PORT=8001
ENV OTP_PORT=8080
ENV PORT=8000
# Optional DB pieces (can be provided by the platform). If DATABASE_URL is set, it takes precedence.
ENV POSTGRES_HOST="" \
    POSTGRES_PORT=5432 \
    POSTGRES_USER="" \
    POSTGRES_PASSWORD="" \
    POSTGRES_DB="" \
    DATABASE_URL=""

# 1) NestJS artifacts
COPY --from=build /app/package*.json ./
COPY --from=build /app/prisma ./prisma
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi
RUN npx --yes prisma generate
COPY --from=build /app/dist ./dist
# Generated files from scripts/init.ts (e.g., /data)
COPY --from=build /app/data ./data

# 2) OTP JAR
# This digest corresponds to OpenTripPlanner 2.8.0-SNAPSHOT (commit 27cb855..., build 2025-07-27), to match the docker-compose pin.
RUN mkdir -p /opt/otp /var/opentripplanner
# OTP image uses Jib layout (no single shaded JAR): /app/{resources,classes,libs}
COPY --from=otpimage /app /opt/otpapp

# If init.ts creates data for OTP — they are already in /app/data
# They can be mounted into the OTP directory:
RUN if [ -d /app/data/otp ]; then \
    for f in /app/data/otp/*; do [ -e "$f" ] && ln -s "$f" /var/opentripplanner/; done; \
    fi

# 3) Caddy config
RUN mkdir -p /etc/caddy
RUN printf '\
    :{$PORT}\n\
    encode gzip\n\
    \n\
    route /otp* {\n\
    uri strip_prefix /otp\n\
    reverse_proxy 127.0.0.1:%s\n\
    }\n\
    \n\
    route {\n\
    reverse_proxy 127.0.0.1:%s\n\
    }\n' "$OTP_PORT" "$NEST_PORT" > /etc/caddy/Caddyfile

# 4) Supervisord config
RUN printf '\
    [supervisord]\n\
    nodaemon=true\n\
    user=root\n\
    \n\
    [program:nest]\n\
    command=/bin/sh -lc '\''\
    # Compose DATABASE_URL at runtime if not provided; prefer full URL when present\n\
    : "${POSTGRES_PORT:=5432}"; \
    if [ -z "${DATABASE_URL}" ] && [ -n "${POSTGRES_HOST}" ] && [ -n "${POSTGRES_USER}" ] && [ -n "${POSTGRES_PASSWORD}" ] && [ -n "${POSTGRES_DB}" ]; then \
    export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}?schema=public"; \
    fi; \
    echo "📦 Prisma will use DATABASE_URL=${DATABASE_URL:-<not-set>}"; \
    npx prisma migrate deploy --schema=prisma/schema.prisma || npx prisma db push --schema=prisma/schema.prisma; \
    \
    # Detect compiled Nest entrypoint robustly\n    TARGET=""; \
    for f in dist/main.js dist/src/main.js dist/apps/*/main.js; do \
    if [ -f "$f" ]; then TARGET="$f"; break; fi \
    done; \
    if [ -z "$TARGET" ]; then \
    echo "❌ No compiled entrypoint found under ./dist"; ls -R dist || true; exit 1; \
    fi; \
    echo "▶️  Starting NestJS: $TARGET"; \
    exec node "$TARGET"'\''\n\
    environment=PORT=%s,OTP_BASE_URL=%%(ENV_OTP_BASE_URL)s\n\
    stdout_logfile=/dev/stdout\n\
    stdout_logfile_maxbytes=0\n\
    stderr_logfile=/dev/stderr\n\
    stderr_logfile_maxbytes=0\n\
    autorestart=false\n\
    \n\
    [program:otp]\n\
    directory=/var/opentripplanner\n\
    command=/bin/sh -lc '\''\
    set -e; \
    # Determine data base dir (root or nested otp/)\
    BASE_DIR=/var/opentripplanner; \
    if [ -d /var/opentripplanner/otp ]; then BASE_DIR=/var/opentripplanner/otp; fi; \
    echo "⏳ Waiting for OTP data in $BASE_DIR (GTFS/OSM or prebuilt graph)..."; \
    for i in $(seq 1 60); do \
    if ls "$BASE_DIR"/*.zip >/dev/null 2>&1 || ls "$BASE_DIR"/*.pbf >/dev/null 2>&1 || [ -f "$BASE_DIR"/graph.obj ]; then \
    echo "✅ OTP data detected in $BASE_DIR"; break; \
    fi; \
    echo "  No GTFS/OSM yet... retry $i/60"; sleep 2; \
    done; \
    exec /usr/bin/java -Xmx2G \
    -cp /opt/otpapp/resources:/opt/otpapp/classes:/opt/otpapp/libs/* \
    org.opentripplanner.standalone.OTPMain \
    "$BASE_DIR" --build --save --serve'\''\n\
    environment=OTP_PORT=%s\n\
    stdout_logfile=/dev/stdout\n\
    stdout_logfile_maxbytes=0\n\
    stderr_logfile=/dev/stderr\n\
    stderr_logfile_maxbytes=0\n\
    startsecs=20\n\
    \n\
    [program:caddy]\n\
    command=caddy run --config /etc/caddy/Caddyfile --adapter caddyfile\n\
    stdout_logfile=/dev/stdout\n\
    stdout_logfile_maxbytes=0\n\
    stderr_logfile=/dev/stderr\n\
    stderr_logfile_maxbytes=0\n\
    autorestart=false\n' "$NEST_PORT" "$OTP_PORT" > /etc/supervisord.conf

EXPOSE 8000
CMD ["/usr/bin/supervisord","-c","/etc/supervisord.conf"]