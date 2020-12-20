'use strict';

const handler = require('../../lib/handler');
const _ = require('lodash');

const dynamodb = require('../../utils/dynamoDb');
const { injectDataIntoVaultAtKey } = require('../../utils/vaults');
const { getVaultsApy } = require('../vaults/apy/handler');

const db = dynamodb.doc;

const getVaults = async () => {
  const params = {
    TableName: 'vaults',
  };
  const entries = await db.scan(params).promise();
  const vaults = entries.Items;
  return vaults;
};

module.exports.getVaults = getVaults;

module.exports.handler = handler(async (event) => {
  const allVaults = await getVaults();
  const queryParams = event.queryStringParameters;
  const showApy = _.get(queryParams, 'apy') === 'true';

  // Inject APY into vaults
  const apy = showApy && (await getVaultsApy());
  const injectApy = (vault) => {
    const newVault = injectDataIntoVaultAtKey(vault, apy, 'apy');
    return newVault;
  };

  const vaultsWithData = _.chain(allVaults).map(injectApy);

  return vaultsWithData;
});
