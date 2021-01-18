'use strict';

const handler = require('../../lib/handler');
const dynamodb = require('../../utils/dynamoDb');
const _ = require('lodash');

const db = dynamodb.doc;

const getHoldings = async () => {
  const params = {
    TableName: 'historicTvl',
  };
  const entries = await db.scan(params).promise();
  const holdings = entries.Items;

  return holdings;
};

module.exports.handler = handler(async (event) => {
  const queryParams = event.queryStringParameters;
  const showHistoric = _.get(queryParams, 'historic') === 'true';
  const holdings = await getHoldings();
  if (showHistoric) {
    return holdings;
  }
  return holdings[holdings.length - 1];
});
