'use strict';

const handler = require('../../../lib/handler');
require('dotenv').config();
const fetch = require('node-fetch');

const subgraphUrl =
  'https://api.thegraph.com/subgraphs/name/salazarguille/yearn-vaults-v2-subgraph-rinkeby';

const getGraphData = async () => {
  const query = `
  {
  vaults {
    id
    transaction {
      id
    }
    status
    vault
    strategies {
      id
      strategy
      vault
      debtLimit
      rateLimit
      performanceFee
      blockNumber
      timestamp
    }
    vaultName
    vaultSymbol
    vaultDecimals
    apiVersion
    deploymentId
    token
    tokenName
    tokenSymbol
    tokenDecimals
    blockNumber
    timestamp
  }
}
  `;

  const response = await fetch(subgraphUrl, {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
  const responseJson = await response.json();
  const graphData = responseJson.data;
  return graphData;
};

module.exports.handler = handler(async () => {
  const graphData = await getGraphData();
  return graphData;
});
