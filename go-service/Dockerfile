FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY corporate-ca.pem /usr/local/share/ca-certificates/corporate-ca.crt
RUN cat /usr/local/share/ca-certificates/corporate-ca.crt >> /etc/ssl/certs/ca-certificates.crt
RUN apk add --no-cache tzdata
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server

FROM scratch
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo
WORKDIR /app
COPY --from=builder /app/server .
EXPOSE 8080
CMD ["./server"]
