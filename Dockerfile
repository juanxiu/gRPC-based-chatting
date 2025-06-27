FROM golang:1.24.3 as builder

WORKDIR /app
COPY . .
RUN go mod download
RUN go build -o chat-server main.go

FROM debian:bullseye-slim
WORKDIR /app
COPY --from=builder /app/chat-server .
CMD ["./chat-server"]
