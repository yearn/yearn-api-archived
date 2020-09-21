"use strict";

require("dotenv").config();
const fetch = require("node-fetch");
const subgraphUrl = process.env.SUBGRAPH_ENDPOINT;
const _ = require("lodash");

module.exports.handler = async (event) => {
  const graphData = await getGraphData();
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify(graphData),
  };
};

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
    method: "POST",
    body: JSON.stringify({ query }),
  });

  const responseJson = await response.json();
  const graphData = responseJson.data;
  return graphData;
};
