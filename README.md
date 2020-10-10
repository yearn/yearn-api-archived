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

### Clone repoistory

`git clone https://github.com/yearn-integrations/api.git`

### Configure local environment

#### Copy .env file

- The ".env" file in the root directory contains various configuration constants utilized by APIs
- Run the command `cp .env.example .env` to copy .env file template
- Populate your new .env file with your web3, archive node, and graph endpoints
- Populate the .env file with your AWS Credentials in order for the docker container to make a connection to S3

## Usage Instructions

### Use "Offline Mode" for local development and testing

- Run the command `docker-compose up` to test API endpoints locally
- You can reach the API under localhost:3000
  - If you want to change the local port, change the "ports" entry under "serverless" in the docker-compose.yml
- The dirs config, services and utils are mounted into the running container, so you code changes will become available instantly on the running instance
  - If you want to change that, remove the "volumes" entries under "serverless" in the docker-compose.yml

## Stages

- Currently three stages are available
- `prod` is used for production deployments. Production endpoint is https://api.yearn.tools
- `dev` is used for development purposes. Development endpoint is https://dev-api.yearn.tools
- `staging` is used for APIs pending production deployment. Staging endpoint is https://staging-api.yearn.tools

### Reset a stage

- Use the command `sls remove --stage dev` to remove all functions and custom domains associated with a stage

### API deployment

- Use the command `sls deploy --stage dev` to deploy
- You can also deploy a single function using `sls deploy function -f functionName --stage dev`
