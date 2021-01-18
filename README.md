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

  - .sample.local.env - uses a local dynamodb instance in the container rather than AWS. Need to call 'save' apis to populate the local tables.
  - .sample.dev.env - uses dynamodb in AWS with credentials (use your own or ask x48 for read-only keys)

- Copy the example .env file

```
cd yearn-api
cp .sample.dev.env .env
```

- Start the docker container

```
docker-compose up
```

- The API should now be running locally on your dev machine

### Optional - Configure environment variables

- .sample.loca.env and .sample.dev.env contain sample API keys for various services (Infura/Etherscan). This is done to enable developers to get up to speed quickly. If you are planning on developing APIs that extensively utilize these keys please consider generating new API keys :)
- Update your .env file to use your own custom web3, archive node, and graph endpoints
- Update your .env file to use your own custom AWS Credentials (if using .sample.dev.env and not .sample.loca.env)

## Usage Instructions

### Use "Offline Mode" (.sample.loca.env) for local development and testing

- Run the command `docker-compose up` to test API endpoints locally
- You can reach the API under localhost:3000
  - use localhost:3000/local
  - If you want to change the local port, change the "ports" entry under "serverless" in the docker-compose.yml
- The dirs config, services and utils are mounted into the running container, so you code changes will become available instantly on the running instance
  - If you want to change that, remove the "volumes" entries under "serverless" in the docker-compose.yml
  - Once API is running, you need to populate the DBs with data. For example, run the following command inside the container: `sls invoke local --fuction vaults-apy-save` which will store APY values for all vaults into DB. Afterwards, you can read the values by calling http://0.0.0.0:3000/local/vaults/apy.
  - You can find all the function names which can be called in the serverless.yml file.

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
