# Multi-target Dockerfile for Go microservices.
# Build any service via --build-arg SERVICE=<name>
# where <name> is: power-service | core-api | network-ops
#
# Usage:
#   docker build --build-arg SERVICE=power-service -t dc-infra-map-power:latest .
#   docker build --build-arg SERVICE=core-api -t dc-infra-map-core:latest .
#   docker build --build-arg SERVICE=network-ops -t dc-infra-map-netops:latest .

# --- Stage 1: Builder ---
FROM golang:1.23-alpine AS builder

ARG SERVICE=power-service

COPY corporate-ca.pem /usr/local/share/ca-certificates/corporate-ca.crt
RUN cat /usr/local/share/ca-certificates/corporate-ca.crt >> /etc/ssl/certs/ca-certificates.crt

RUN apk add --no-cache tzdata

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o /server ./cmd/${SERVICE}

# --- Stage 2: Runtime ---
FROM scratch

COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo
COPY --from=builder /server /server

EXPOSE 8080

ENTRYPOINT ["/server"]
