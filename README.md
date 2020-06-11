# glider-aggregator

## Dependencies
Requires:
* node.js 10.x or 12.x
* npm
* [now-cli](https://zeit.co/download) installed globaly

## Initial setup

### Install dependencies
```bash
$ npm i
```

### Create a configuration file
Create a `.env` file at the root of the project with the environment variables.

## Run local servers
You can run your own local servers or use remote servers. By default the configuration expects local servers up and running. For a shorthand use:

```bash
npm run localservers
```

To override the configuration environment for servers, you can create/edit an `.env` file at the root of the project with the details. For example:
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

## CI/CD

Documentation for continuous integration and delivery framework is available by [the link](./docs/cicd.md).
