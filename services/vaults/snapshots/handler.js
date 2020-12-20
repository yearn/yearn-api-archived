'use strict';

const handler = require('../../../lib/handler');
require('dotenv').config();
const fetch = require('node-fetch');

const subgraphUrl = process.env.SUBGRAPH_ENDPOINT;

const getGraphData = async () => {
  const query = `
  {
    vaults {
      address: id
      name
      getPricePerFullShare
      totalSupply
      balance
      controller
      timestamp
      token
      symbol
      blockNumber
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
