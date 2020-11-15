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
<<<<<<< HEAD
=======

RUN chmod 777 ./startserverless.sh

>>>>>>> c06309e6d1165aea967700c975a0287ce164f77c
ENTRYPOINT ./startserverless.sh
