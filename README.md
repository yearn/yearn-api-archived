# To get started:

## Install serverless
https://www.serverless.com/framework/docs/getting-started/

## Configure local environment
Optionally create the file awsProfile.yml in the root folder to specify which aws_profile in ~/.aws/credentials serverless should use to deploy.
This file can be created by copying the contents of example.awsProfile.yml and changing the profile value.

If this step is omitted, you will see a warning about the file not being found, and your default aws profile will be used (I think).

Create a .env file in the root foler to store subgraph and web3 endpoints.
This file can be created by copying the contents of .example.env and changing the endpoint values.

In the future AWS KMS should probably be used to manage these variables instead.


## Use offline mode for local development and testing
The serverless offline plugin is a dev dependency and can be used to simulate the lambda environment and API gateway locally to run and debug lambda functions.
Start the server listening for connections with:

sls offline

See https://www.npmjs.com/package/serverless-offline for further details.
