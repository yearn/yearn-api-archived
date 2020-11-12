'use strict';

const dynamodb = require('../../../utils/dynamoDb');
const _ = require('lodash');

const db = dynamodb.doc;

module.exports.handler = async () => {
  const params = {
    TableName: 'vaultApy',
  };
  const entries = await db.scan(params).promise();
  const vaults = entries.Items;

  const symbol = 'crvBTC';
  const assets = ['renBTC', 'wBTC', 'sBTC'];

  const vault = _.find(vaults, { symbol });
  const { apyLoanscan = 0 } = vault;

  const getLoanscanFormat = (tokenSymbol) => {
    const apy = apyLoanscan / 100;
    const apr = apy;
    const loanScanData = { apy, apr, tokenSymbol };
    return loanScanData;
  };

  const loanScanResponse = { lendRates: _.map(assets, getLoanscanFormat) };

  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(loanScanResponse),
  };
  return response;
};
