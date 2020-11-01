FROM node:12-buster

# default to dev but this can be overwritten by docker-compose
ENV SERVERLESS_STAGE dev

RUN npm install -g serverless && \
    npm install -g serverless-offline

RUN apt-get update
RUN apt-get -y install default-jre

WORKDIR /opt/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

RUN sls dynamodb install
ENTRYPOINT ./startserverless.sh
