FROM golang:1.16-alpine3.12 as builder

WORKDIR /usr/src/app
COPY . .

# Download dependencies and build app
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o curriculum-utility .

# start multi-stage docker build
FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /usr/src/app/curriculum-utility .

EXPOSE 8081

CMD [ "./curriculum-utility" ]
