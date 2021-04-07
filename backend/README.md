# Golang Test API
An example API written in Go using Gin and GORM

## Local Setup
```bash
# Download dependencies
go mod download

# Build and run app on localhost:8080
go build
./golang-test
```

## Docker Setup
```bash
# Build docker image
docker build --tag gotest:1.0 .

# Run docker image
docker run --publish 8080:8080 gotest:1.0
```

## REST API Methods
* Get a list of all posts: `GET /posts`
* Get a single post + comments: `GET /posts/{id}`
* Upload a new post: `POST /posts`
* Upload a new comment on a post `POST /posts/{id}/comment`

Example POST body for `/posts`:
```json
{
  "user": "Alex",
  "title": "Hello world!",
  "content": "This is my first post."
}
```

Example POST body for `/posts/{id}/comment`:
```json
{
  "user": "Alex",
  "content": "Nice to meet you!",
}
```
