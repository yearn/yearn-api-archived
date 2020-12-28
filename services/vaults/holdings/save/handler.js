/* 

Holdings calculated here are for Vaults, Strategies and the Earn yTokens
This is part of the TVL calculation defined here: https://hackmd.io/@dudesahn/BkxKfTzqw

 */

'use strict';

require('dotenv').config();

const dynamodb = require('../../../../utils/dynamoDb');
const delay = require('delay');
const vaults = require('./vaults');
const pools  = require('./earn');
const { delayTime } = require('./config');
const axios = require('axios');
const { getHoldings, getPoolTotalSupply, getEarnHoldings } = require('./getHoldings');
const oracle = require('../../../../utils/priceFeed');

const db = dynamodb.doc;
const Web3 = require('web3');

const web3 = new Web3(process.env.WEB3_ENDPOINT);

const saveVault = async data => {
  const params = {
    TableName: 'holdings',
    Item: data,
  };
  await db
    .put(params)
    .promise()
    .catch(err => console.log('err', err));
  console.log(`Saved ${data.name}`);
};

const readVault = async vault => {
  const {
    name,
    symbol,
    vaultContractABI: abi,
    vaultContractAddress: address,
    // eslint-disable-next-line camelcase
    price_id,
  } = vault;
  console.log(`Reading vault ${vault.name}`);
  if (!abi || !address) {
    console.log(`Vault ABI not found: ${name}`);
    return null;
  }
  try {
    const holdings = await getHoldings(vault);
    let priceFeed = 0;
    if (vault.price_id){
    priceFeed = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${  vault.price_id}`,
    );
    }
    console.log('Vault: ', name);
    const data = {
      type: 'vault',
      address,
      name,
      symbol,
      price_id,
      price_usd: priceFeed.data.market_data.current_price.usd,
      timestamp: Date.now(),
      holdings,
    };
    await saveVault(data);

    return data;
  } catch (e) {
    console.log('error', e);
    return e;
  }
};


// get the holdings from an Earn product and store it in the DB.
const readEarn = async pool => {

  console.log(`Reading pool ${pool.name}`);
  try {
    let holdings = await getEarnHoldings(pool);
    holdings = {
      type: 'earn',
      ...holdings
    };
    await saveVault(holdings);

    return holdings;
  } catch (e) {
    console.log('error', e);
    return e;
  }
};

// getting the veCRV locked in yearn used to vote on Curve
const readveCRV = async () => {
  const veCRVMinABI = [
    {
      name: 'balanceOf',
      outputs: [
        {
          type: 'uint256',
          name: '',
        },
      ],
      inputs: [
        {
          type: 'address',
          name: 'addr',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
  ];
  const poolContract = new web3.eth.Contract(
    veCRVMinABI,
    '0x5f3b5dfeb7b28cdbd7faba78963ee202a494e2a2',
  );
  const voterAddress = '0xF147b8125d2ef93FB6965Db97D6746952a133934';
  const veCRVLocked =
    (await poolContract.methods.balanceOf(voterAddress).call()) / 1e18;
  const priceFeed = await axios.get(
    'https://api.coingecko.com/api/v3/coins/curve-dao-token',
  );
  const veCRVContract = {
    address: '0x5f3b5dfeb7b28cdbd7faba78963ee202a494e2a2',
    name: 'veCRV',
    symbol: 'veCRV',
    price_id: 'curve-dao-token',
    price_usd: priceFeed.data.market_data.current_price.usd,
    timestamp: Date.now(),
    veCRVLocked,
  };
  await saveVault(veCRVContract);
  return veCRVContract;
};

// getting YFI staked in GOV for the holdings endpoint
const readStaking = async () => {
  const staked = await getPoolTotalSupply(
    '0xBa37B002AbaFDd8E89a1995dA52740bbC013D992',
  );
  const priceFeed = await axios.get(
    'https://api.coingecko.com/api/v3/coins/yearn-finance',
  );
  const stakingContract = {
    address: '0xBa37B002AbaFDd8E89a1995dA52740bbC013D992',
    name: 'staked YFI',
    symbol: 'YFI',
    price_id: 'yearn-finance',
    price_usd: priceFeed.data.market_data.current_price.usd,
    timestamp: Date.now(),
    stakedYFI: staked,
  };
  await saveVault(stakingContract);
  return stakingContract;
};


module.exports.handler = async () => {
  const vaultsWithHoldings = [];
  // iterating over vaults to fetch Vault and Strategy holdings
  for (const vault of vaults) {
    const vaultWithHoldings = await readVault(vault);
    if (vaultWithHoldings !== null) {
      vaultsWithHoldings.push(vaultWithHoldings);
    }
    await delay(delayTime);
  }
 // iterating over Earn products to fetch the earn holdings
  for (const pool of pools) {
    const earnWithHoldings = await readEarn(pool);
    if (earnWithHoldings !== null) {
      vaultsWithHoldings.push(earnWithHoldings);
    }
    await delay(delayTime);
  }

  const staked = await readStaking();
  const veCRVLocked = await readveCRV();
  vaultsWithHoldings.push(staked);
  vaultsWithHoldings.push(veCRVLocked);

  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(vaultsWithHoldings),
  };
  return response;
};
