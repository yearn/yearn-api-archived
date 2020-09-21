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

### Install serverless

`npm install -g serverless`

### Configure local environment

#### Copy .env file

- The ".env" file in the root directory contains various configuration constants utilized by APIs
- Run the command `cp .env.example .env` to copy .env file template
- Populate your new .env file with your web3, archive node, and graph endpoints
- In the future we may utilize AWS KMS to manage these constants

#### Select AWS profile

- Run the command `cp awsProfile.yml.example awsProfile.yml` to copy awsProfile.yml file template
- By default the AWS profile "default" (in ~/.aws/credentials) is utilized
- If you'd like to utilize a different AWS profile, edit your new "awsProfile.yml" file to select a profile

## Usage Instructions

### Use "Offline Mode" for local development and testing

- Use the command `sls offline` to test API endpoints locally

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
