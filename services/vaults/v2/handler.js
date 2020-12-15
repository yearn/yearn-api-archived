'use strict';

require('dotenv').config();
const fetch = require('node-fetch');

const subgraphUrl =
  'https://api.thegraph.com/subgraphs/name/salazarguille/yearn-vaults-v2-subgraph-rinkeby';

module.exports.handler = async () => {
  const graphData = await getGraphData();
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(graphData),
  };
};

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
