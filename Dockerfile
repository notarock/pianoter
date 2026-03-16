FROM golang:1.26-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o pianoter ./cmd/server

FROM alpine:3.23
WORKDIR /app
COPY --from=builder /app/pianoter .
EXPOSE 8080
ENV JWT_SECRET=""
CMD ["./pianoter"]
