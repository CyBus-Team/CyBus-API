# ---- Base with Node + Java + tools ------------------------------------------
FROM node:20-alpine AS base
RUN apk add --no-cache openjdk17-jre caddy supervisor bash curl

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

# 1) NestJS artifacts
COPY --from=build /app/package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi
COPY --from=build /app/dist ./dist
# Generated files from scripts/init.ts (e.g., /data)
COPY --from=build /app/data ./data

# 2) OTP JAR
# This digest corresponds to OpenTripPlanner 2.8.0-SNAPSHOT (commit 27cb855..., build 2025-07-27), to match the docker-compose pin.
RUN mkdir -p /opt/otp /var/opentripplanner
COPY --from=otpimage /opt/otp/otp.jar /opt/otp/otp.jar

# If init.ts creates data for OTP — they are already in /app/data
# They can be mounted into the OTP directory:
RUN [ -d /app/data/otp ] && ln -s /app/data/otp /var/opentripplanner || true

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
    command=/usr/local/bin/node /app/dist/main.js\n\
    environment=PORT=%s\n\
    stdout_logfile=/dev/fd/1\n\
    stderr_logfile=/dev/fd/2\n\
    autorestart=true\n\
    \n\
    [program:otp]\n\
    directory=/var/opentripplanner\n\
    command=/usr/bin/java -Xmx2G -jar /opt/otp/otp.jar --build --save --serve\n\
    stdout_logfile=/dev/fd/1\n\
    stderr_logfile=/dev/fd/2\n\
    autorestart=true\n\
    \n\
    [program:caddy]\n\
    command=/usr/bin/caddy run --config /etc/caddy/Caddyfile --adapter caddyfile\n\
    stdout_logfile=/dev/fd/1\n\
    stderr_logfile=/dev/fd/2\n\
    autorestart=true\n' "$NEST_PORT" > /etc/supervisord.conf

EXPOSE 8000
CMD ["/usr/bin/supervisord","-c","/etc/supervisord.conf"]