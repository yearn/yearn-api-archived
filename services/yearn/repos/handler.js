'use strict';

const dynamodb = require('../../../utils/dynamoDb');
const _ = require('lodash');

const db = dynamodb.doc;

const getRepos = async () => {
  const params = {
    TableName: 'repos',
  };
  const entries = await db.scan(params).promise();
  const repos = entries.Items;
  return repos;
};

exports.handler = async () => {
  const repos = await getRepos();
  const orderedRepos = _.orderBy(repos, 'pushed_at', 'desc');
  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(orderedRepos),
  };
  return response;
};
