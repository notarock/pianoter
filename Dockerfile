FROM --platform=$BUILDPLATFORM golang:1.26-alpine AS builder
ARG TARGETARCH
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=$TARGETARCH go build -o pianoter .

FROM alpine:3.23
WORKDIR /app
COPY --from=builder --chmod=755 /app/pianoter .
EXPOSE 8080
ENV JWT_SECRET=""
CMD ["./pianoter"]
