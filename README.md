## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ yarn install
```

## Compile and run the project

```bash
# docker:
$ docker-compose up -d
$ docker-compose ps

#kafka
#create topic
$ docker exec -it <kafka-container-id> kafka-topics --create --topic my-topic --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1

#produce message
$ docker exec -it <kafka-container-id> kafka-console-producer --topic my-topic --bootstrap-server localhost:9092

#consume message
$ docker exec -it <kafka-container-id> kafka-console-consumer --topic my-topic --bootstrap-server localhost:9092 --from-beginning

# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```
