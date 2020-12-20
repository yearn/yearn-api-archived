'use strict';

const handler = require('../../../lib/handler');
const dynamodb = require('../../../utils/dynamoDb');
// const _ = require('lodash');

const db = dynamodb.doc;

const getVaultsHoldings = async () => {
  const params = {
    TableName: 'holdings',
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

module.exports.getVaultsHoldings = getVaultsHoldings;

module.exports.handler = handler(async () => {
  const holdings = await this.getVaultsHoldings();
  return holdings;
});
