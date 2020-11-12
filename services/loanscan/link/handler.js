'use strict';

const dynamodb = require('../../../utils/dynamoDb');
const _ = require('lodash');

const db = dynamodb.doc;

module.exports.handler = async () => {
  const params = {
    TableName: 'vaultApy',
  };
  const entries = await db.scan(params).promise();
  const items = entries.Items;

  const getLoanScanFormat = (item) => {
    const { apyOneDaySample, symbol: tokenSymbol } = item;
    const apy = apyOneDaySample / 100;
    const apr = apy;
    const loanScanData = { apy, apr, tokenSymbol };
    return loanScanData;
  };

  const lendRates = _.map(items, getLoanScanFormat);

  const filteredLendRates = _.filter(lendRates, { tokenSymbol: 'aLINK' });

  const fixedLendRates = filteredLendRates.map((rate) => {
    if (rate.tokenSymbol === 'aLINK') {
      rate.tokenSymbol = 'LINK';
    }
    return rate;
  });

  const loanScanResponse = {
    lendRates: fixedLendRates,
  };

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
