/* 

Holdings calculated here are for Vaults, Strategies and the Earn yTokens
This is part of the TVL calculation defined here: https://hackmd.io/@dudesahn/BkxKfTzqw

 */

'use strict';

require('dotenv').config();
const dynamodb = require('../../../../utils/dynamoDb');
const Web3 = require("web3");
const moment = require("moment");
const delay = require("delay");
const _ = require("lodash");
const vaults = require("./vaults");
const EthDater = require("./ethereum-block-by-date.js");
const { delayTime } = require("./config");

const { getHoldings } = require('./getHoldings');

const db = dynamodb.doc;
const archiveNodeUrl = process.env.ARCHIVENODE_ENDPOINT;
const infuraUrl = process.env.WEB3_ENDPOINT;
const archiveNodeWeb3 = new Web3(archiveNodeUrl);
const infuraWeb3 = new Web3(infuraUrl);
const blocks = new EthDater(archiveNodeWeb3, delayTime);
const axios = require('axios');



const saveVault = async (data) => {
  const params = {
    TableName: "holdings",
    Item: data,
  };
  await db
    .put(params)
    .promise()
    .catch((err) => console.log("err", err));
  console.log(`Saved ${data.name}`);
};




const readVault = async (vault) => {
  const {
    name,
    symbol,
    description,
    vaultSymbol,
    vaultContractABI: abi,
    vaultContractAddress: address,
    erc20address: tokenAddress,
    price_id: price_id
  } = vault;
  console.log(`Reading vault ${vault.name}`);
  if (!abi || !address) {
    console.log(`Vault ABI not found: ${name}`);
    return null;
  }
  try{
    const holdings= await getHoldings(vault);
    const priceFeed = await axios.get('https://api.coingecko.com/api/v3/coins/' + vault.price_id);
    console.log("Vault: ", name);
    const data = {
      address,
      name,
      symbol,
      price_id,
      price_usd: priceFeed.data.market_data.current_price.usd,
      timestamp: Date.now(),
      holdings    
    };
  await saveVault(data);
    console.log(data);
    return data;
  } catch(e) {
    console.log("error", e);
    return e
  }
 
  
};

module.exports.handler = async (context) => {
  let vaultsTVL = 0;

  const vaultsWithHoldings = [];
  for (const vault of vaults) {
    const vaultWithHoldings = await readVault(vault);
    /* vaultsTVL += (vaultWithHoldings.holdings.vaultHoldings + vaultWithHoldings.holdings.strategyHoldings) * vaultWithHoldings.price_usd; */
    /* console.log(vaultsTVL); */
    if (vaultWithHoldings !== null) {
      vaultsWithHoldings.push(vaultWithHoldings);
    }
    
    await delay(delayTime);
  }
  vaultsWithHoldings.push({TotalvaultsTVL: vaultsTVL});
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify(vaultsWithHoldings),
  };
  return response;
};
