'use strict';

const AWS = require('aws-sdk');
const _ = require('lodash');

const client = new AWS.DynamoDB.DocumentClient();

module.exports.batchGet = async (table, keys, batchSize = 50) => {
  return (
    await Promise.all(
      _.chunk(keys, batchSize).map(async (Keys) => {
        const params = {
          RequestItems: {
            [table]: {
              Keys,
            },
          },
        };
        const { Responses: res } = await client.batchGet(params).promise();
        return res[table];
      }),
    )
  ).flat();
};

module.exports.batchSet = async (table, items, batchSize = 25) => {
  return await Promise.all(
    _.chunk(items, batchSize).map(async (chunk) => {
      const params = {
        RequestItems: {
          [table]: chunk.map((Item) => ({
            PutRequest: { Item },
          })),
        },
      };
      await client.batchWrite(params).promise();
    }),
  );
};

module.exports.scan = async (table) => {
  const { Items: items } = await client
    .scan({
      TableName: table,
    })
    .promise();
  return items;
};
