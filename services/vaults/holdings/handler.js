'use strict';

const dynamodb = require('../../../utils/dynamoDb');
// const _ = require('lodash');

const db = dynamodb.doc;

const getVaultsApy = async () => {
  const params = {
    TableName: "vaultApy",
  };
  const entries = await db.scan(params).promise();
  const apy = entries.Items;

/*   const injectVaultAddress = (vault) => {
    vault.vaultAddress = vault.address;
    return vault;
  };
  const vaultAddress = _.map(apy, injectVaultAddress); */
  return apy;
};

exports.getVaultsApy = getVaultsApy;

exports.handler = async (event) => {
  const apy = await getVaultsApy();
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify(apy),
  };
  return response;
};
