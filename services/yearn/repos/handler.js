'use strict';

const handler = require('../../../lib/handler');
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

module.exports.handler = handler(async () => {
  const repos = await getRepos();
  const orderedRepos = _.orderBy(repos, 'pushed_at', 'desc');
  return orderedRepos;
});
