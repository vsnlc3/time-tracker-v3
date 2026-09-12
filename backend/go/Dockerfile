FROM golang:1.27.0

WORKDIR /app

COPY go.mod ./
COPY . .

EXPOSE 8080

CMD ["go", "run", "."]
