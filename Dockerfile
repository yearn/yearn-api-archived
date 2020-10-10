FROM node:14-buster

RUN npm install -g serverless && \
    npm install -g serverless-offline

WORKDIR /opt/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD [ "sls", "offline", "--host", "0.0.0.0" ]
