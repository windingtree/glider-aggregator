# glider-aggregator

## Dependencies
Requires [now-cli](https://zeit.co/download) installed globaly

## Initial setup

```bash
$ npm i
```

## Run local servers

```bash
npm run localservers
```

Configuration environment for servers (should be placed to the `.env` file):  

```
REDIS_URL = redis://localhost:6379
MONGO_URL = mongodb://localhost/glider
ELASTIC_URL = http://localhost:9200
```

[Kibana](https://www.elastic.co/kibana) GUI will be available by the link: [`http://localhost:5601/`](http://localhost:5601)

## Run tests

```bash
npm test
npm run test:newman
```

## Run locally

```bash
$ npm run dev
```

