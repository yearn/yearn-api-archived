'use strict';

const AWS = require('aws-sdk');

const client = new AWS.DynamoDB.DocumentClient();

module.exports = {
  batchGet: (params) => client.batchGet(params).promise(),
  batchWrite: (params) => client.batchWrite(params).promise(),
};
