FROM rust:1-slim AS wasm-builder

RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

WORKDIR /wasm
COPY wasm/Cargo.toml wasm/Cargo.lock* ./
COPY wasm/src ./src

RUN wasm-pack build --release --target web --out-dir pkg

FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy WASM build output
COPY --from=wasm-builder /wasm/pkg ./wasm/pkg

# Copy source code
COPY . .

# Build the application (WASM already built in previous stage)
RUN npx vite build

FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Set proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Expose port
EXPOSE 3000

# Run as nginx user
USER nginx

CMD ["nginx", "-g", "daemon off;"]
