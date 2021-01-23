/* 

Holdings calculated here are for Vaults, Strategies and the Earn yTokens
This is part of the TVL calculation defined here: https://hackmd.io/@dudesahn/BkxKfTzqw

 */

'use strict';

const handler = require('../../../../lib/handler');
require('dotenv').config();

const dynamodb = require('../../../../utils/dynamoDb');
const delay = require('delay');
const vaults = require('./vaults');
const earns = require('./earn');
const pools = require('./pools');
const { delayTime } = require('./config');
const {
  getHoldings,
  getPoolTotalSupply,
  getEarnHoldings,
} = require('./getHoldings');
const oracle = require('../../../../utils/priceFeed');
const getVirtualPrice = require('../../apy/save/handler');
const _ = require('lodash');

const db = dynamodb.doc;
const Web3 = require('web3');

const web3 = new Web3(process.env.WEB3_ENDPOINT_HTTPS);

const saveVault = async (data) => {
  const params = {
    TableName: 'holdings',
    Item: data,
  };
  await db
    .put(params)
    .promise()
    .catch((err) => console.log('err', err));
  console.log(`Saved ${data.name}`);
};

const readVault = async (vault) => {
  const {
    name,
    symbol,
    vaultContractABI: abi,
    vaultContractAddress: address,
  } = vault;
  console.log(`Reading vault ${vault.name}`);
  if (!abi || !address) {
    console.log(`Vault ABI not found: ${name}`);
    return null;
  }
  try {
    const holdings = await getHoldings(vault);
    let priceFeed = 0;

    // calling virtual price for Curve tokens
    if (
      vault.symbol === 'yCRV' ||
      vault.symbol === 'yvmusd3CRV' ||
      vault.symbol === 'yvgusd3CRV' ||
      vault.symbol === 'yvcDAI+cUSDC' ||
      vault.symbol === 'crvBUSD' ||
      vault.symbol === 'crvBTC' ||
      vault.symbol === '3Crv' ||
      vault.symbol === 'eursCRV'
    ) {
      const pool = _.find(pools, { symbol });
      const currentBlockNbr = await web3.eth.getBlockNumber();
      const virtualPriceCurrent = await getVirtualPrice.getVirtualPrice(
        pool.address,
        currentBlockNbr,
      );

      priceFeed = virtualPriceCurrent / 1e18;
    }
    // setting price_usd to 1 for TUSD, USDC, USDT, DAI
    if (
      vault.symbol === 'TUSD' ||
      vault.symbol === 'USDC' ||
      vault.symbol === 'GUSD' ||
      vault.symbol === 'USDT' ||
      vault.symbol === 'DAI' ||
      vault.symbol === 'aLINK' ||
      vault.symbol === 'mUSD'
    ) {
      priceFeed = 1;
    }
    // get price from uniquote oracle
    if (
      vault.symbol === 'YFI' ||
      vault.symbol === 'WETH' ||
      vault.symbol === 'LINK'
    ) {
      priceFeed = await oracle.getPrice(vault.symbol);
    }

    console.log('Vault: ', name);
    const data = {
      type: 'vault',
      address,
      name,
      symbol,
      price_usd: priceFeed,
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
const readEarn = async (pool) => {
  console.log(`Reading pool ${pool.name}`);
  try {
    let holdings = await getEarnHoldings(pool);
    holdings = {
      type: 'earn',
      ...holdings,
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
  const priceFeed = await oracle.getPrice('CRV');

  const veCRVContract = {
    address: '0x5f3b5dfeb7b28cdbd7faba78963ee202a494e2a2',
    name: 'veCRV',
    symbol: 'veCRV',
    price_usd: priceFeed,
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
  const priceFeed = await oracle.getPrice('YFI');

  const stakingContract = {
    address: '0xBa37B002AbaFDd8E89a1995dA52740bbC013D992',
    name: 'staked YFI',
    symbol: 'YFI',
    price_usd: priceFeed,
    timestamp: Date.now(),
    stakedYFI: staked,
  };
  await saveVault(stakingContract);
  return stakingContract;
};

module.exports.handler = handler(async () => {
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
  for (const earn of earns) {
    const earnWithHoldings = await readEarn(earn);
    if (earnWithHoldings !== null) {
      vaultsWithHoldings.push(earnWithHoldings);
    }
    await delay(delayTime);
  }

  const staked = await readStaking();
  const veCRVLocked = await readveCRV();
  vaultsWithHoldings.push(staked);
  vaultsWithHoldings.push(veCRVLocked);
  return vaultsWithHoldings;
});
