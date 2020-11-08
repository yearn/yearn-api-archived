# Yearn API

Yearn API is a collection of Serverless API endpoints focused on Yearn integrations.

Yearn API intentions are as follows:

- Provide free API endpoints to simplify 3rd party integration with Yearn
- Provide an "API playground" (Swagger UI) anyone can use to quickly browse and test available APIs
- Document all existing APIs
- Allow the entire API stack to be forked to enable community involvement in API development

## Interact

https://yearn.tools

## Setup Instructions

### Quick start

- Install docker
- Clone repo

```
git clone https://github.com/yearn-integrations/yearn-api.git
```

- Pick an example environment file to use:
  - .sample.env.local - uses a local dynamodb instance in the container rather than AWS. Need to call 'save' apis to populate the local tables.
  - .sample.env.dev - uses dynamodb in AWS with credentials (use your own or ask x48 for read-only keys)

- Copy the example .env file

```
cd yearn-api
cp .sample.env.local .env
```

- Start the docker container

```
docker-compose up
```

- The API should now be running locally on your dev machine

### Optional - Configure environment variables

- .sample.env.local and .sample.env.dev contain sample API keys for various services (Infura/Etherscan). This is done to enable developers to get up to speed quickly. If you are planning on developing APIs that extensively utilize these keys please consider generating new API keys :)
- Update your .env file to use your own custom web3, archive node, and graph endpoints
- Update your .env file to use your own custom AWS Credentials (if using .sample.env.dev and not .sample.sample.env.local)

## Usage Instructions

### Use "Offline Mode" for local development and testing

- Run the command `docker-compose up` to test API endpoints locally
- You can reach the API under localhost:3000
  - use localhost:3000/local or localhost:3000/dev, depending on your environment
  - If you want to change the local port, change the "ports" entry under "serverless" in the docker-compose.yml
- The dirs config, services and utils are mounted into the running container, so you code changes will become available instantly on the running instance
  - If you want to change that, remove the "volumes" entries under "serverless" in the docker-compose.yml

## Stages

- Currently four stages are available
- `prod` is used for production deployments. Production endpoint is https://api.yearn.tools
- `dev` is used for development purposes. Development endpoint is https://dev-api.yearn.tools
- `staging` is used for APIs pending production deployment. Staging endpoint is https://staging-api.yearn.tools
- `local` is used for local development. This stage uses a local dynamodb instance rather than AWS. The database starts out empty, so call the 'save' apis to populate the database with values before testing.

### Reset a stage

- Use the command `sls remove --stage dev` to remove all functions and custom domains associated with a stage

### API deployment

- Use the command `sls deploy --stage dev` to deploy
- You can also deploy a single function using `sls deploy function -f functionName --stage dev`
