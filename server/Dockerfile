FROM golang:1.27.1-alpine AS build
WORKDIR /src
COPY go.mod go.sum* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/arta ./cmd/arta

FROM alpine:3.22
RUN adduser -D -H -u 10001 arta
COPY --from=build /out/arta /usr/local/bin/arta
USER arta
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/arta"]
