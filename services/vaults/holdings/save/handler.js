/* 

Holdings calculated here are for Vaults, Strategies and the Earn yTokens
This is part of the TVL calculation defined here: https://hackmd.io/@dudesahn/BkxKfTzqw

 */

'use strict';

require('dotenv').config();
const dynamodb = require('../../../../utils/dynamoDb');
const delay = require('delay');
const vaults = require('./vaults');
const { delayTime } = require('./config');
const axios = require('axios');
const { getHoldings } = require('./getHoldings');

const db = dynamodb.doc;
const Web3 = require('web3');

const web3 = new Web3(process.env.WEB3_ENDPOINT);
const infuraWeb3 = new Web3(web3);
const getVirtualPrice = require('../../apy/save/handler');

const pools = [
  {
    symbol: 'yCRV',
    address: '0x45F783CCE6B7FF23B2ab2D70e416cdb7D6055f51',
  },
  {
    symbol: 'crvBUSD',
    address: '0x79a8C46DeA5aDa233ABaFFD40F3A0A2B1e5A4F27',
  },
  {
    symbol: 'crvBTC',
    address: '0x7fC77b5c7614E1533320Ea6DDc2Eb61fa00A9714',
  },
  {
    symbol: 'ySUSD',
    address: '0xF61718057901F84C4eEC4339EF8f0D86D2B45600',
  }
];

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
    const priceFeed = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${  vault.price_id}`,
    );
    console.log('Vault: ', name);
    const data = {
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

// EARN product
const getPoolTotalSupply = async poolAddress => {
  const poolMinABI = [
    {
      name: 'totalSupply',
      outputs: [
        {
          type: 'uint256',
          name: 'out',
        },
      ],
      inputs: [],
      constant: true,
      payable: false,
      type: 'function',
      gas: 1181,
    },
  ];
  const poolContract = new web3.eth.Contract(poolMinABI, poolAddress);
  const _totalSupply = (await poolContract.methods.totalSupply().call()) / 1e18;
  return _totalSupply;
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

const getEarnHoldings = async (pool) => {
  const { symbol, erc20address } = pool;
  const currentBlockNbr = await infuraWeb3.eth.getBlockNumber();
  await delay(delayTime);
  const poolAddress = pool.address;
  const virtualPriceCurrent =
    (await getVirtualPrice.getVirtualPrice(poolAddress, currentBlockNbr)) /
    1e18;
  console.log(virtualPriceCurrent);
  const poolTotalSupply = await getPoolTotalSupply(poolAddress);

  poolBalance = poolTotalSupply * virtualPriceCurrent;
  earnHoldings = {
    tokenSymbol: symbol,
    tokenAddress: erc20address,
    poolBalanceUSD: poolBalance,
  };
  return earnHoldings;
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
      /*   const pool = _.find(pools, { symbol }); */

      for(const pool of pools){
        vaultsWithHoldings.push(await getEarnHoldings(pool));
      }

  for (const vault of vaults) {
    const vaultWithHoldings = await readVault(vault);
    if (vaultWithHoldings !== null) {
      vaultsWithHoldings.push(vaultWithHoldings);
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
