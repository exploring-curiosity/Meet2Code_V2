FROM golang:1.22-alpine AS build

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY cmd ./cmd
COPY internal ./internal
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /app/peer-server ./cmd/server

FROM scratch

WORKDIR /app
COPY --from=build /app/peer-server /app/peer-server

EXPOSE 8080

CMD ["/app/peer-server"]
