FROM golang:1.22-alpine AS build

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY cmd ./cmd
COPY internal ./internal
RUN go build -o /app/peer-server ./cmd/server

FROM alpine:3.20
RUN apk add --no-cache ca-certificates

WORKDIR /app
COPY --from=build /app/peer-server /app/peer-server

ENV PORT=8080
EXPOSE 8080

CMD ["/app/peer-server"]
