'use strict';

const dynamodb = require('../../../utils/dynamoDb');
// const _ = require('lodash');

const db = dynamodb.doc;

const getVaultsHoldings = async () => {
  const params = {
    TableName: "holdings",
  };
  const entries = await db.scan(params).promise();
  const holdings = entries.Items;

/*   const injectVaultAddress = (vault) => {
    vault.vaultAddress = vault.address;
    return vault;
  };
  const vaultAddress = _.map(apy, injectVaultAddress); */
  return holdings;
};

exports.getVaultsHoldings = getVaultsHoldings;

exports.handler = async (event) => {
  const holdings = await this.getVaultsHoldings();
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify(holdings),
  };
  return response;
};
