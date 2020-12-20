'use strict';

const handler = require('../../../lib/handler');
const dynamodb = require('../../../utils/dynamoDb');
// const _ = require('lodash');

const db = dynamodb.doc;

const getVaultsApy = async () => {
  const params = {
    TableName: 'vaultApy',
  };
  const entries = await db.scan(params).promise();
  const apy = entries.Items;

  // const injectVaultAddress = (vault) => {
  //   vault.vaultAddress = vault.address;
  //   return vault;
  // };
  // const vaultAddress = _.map(apy, injectVaultAddress);
  return apy;
};

module.exports.getVaultsApy = getVaultsApy;

module.exports.handler = handler(async () => {
  const apy = await getVaultsApy();
  return apy;
});
