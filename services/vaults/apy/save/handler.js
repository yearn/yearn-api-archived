'use strict';

const handler = require('../../../../lib/handler');
require('dotenv').config();
const dynamodb = require('../../../../utils/dynamoDb');
const Web3 = require('web3');
const moment = require('moment');
const _ = require('lodash');
const vaults = require('./vaults');
const EthDater = require('./ethereum-block-by-date.js');
const { delayTime } = require('./config');
const poolABI = require('../../../../abi/pool');
const { getBoost } = require('./getBoost');

const db = dynamodb.doc;
const archiveNodeUrl = process.env.ARCHIVENODE_ENDPOINT;
const infuraUrl = process.env.WEB3_ENDPOINT_HTTPS;
const archiveNodeWeb3 = new Web3(archiveNodeUrl);
const infuraWeb3 = new Web3(infuraUrl);
const blocks = new EthDater(archiveNodeWeb3, delayTime);

let currentBlockNbr;
let oneDayAgoBlock;
let threeDaysAgoBlock;
let oneWeekAgoBlock;
let oneMonthAgoBlock;
let nbrBlocksInDay;
const oneDayAgo = moment().subtract(1, 'days').valueOf();
const threeDaysAgo = moment().subtract(3, 'days').valueOf();
const oneWeekAgo = moment().subtract(1, 'weeks').valueOf();
const oneMonthAgo = moment().subtract(1, 'months').valueOf();

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
];

const saveVault = async (data) => {
  const params = {
    TableName: 'vaultApy',
    Item: data,
  };
  await db
    .put(params)
    .promise()
    .catch((err) => console.log('err', err));
  console.log(`Saved ${data.name}`);
};

const getApy = async (previousValue, currentValue, previousBlockNbr) => {
  if (!previousValue) {
    return 0;
  }
  const blockDelta = currentBlockNbr - previousBlockNbr;
  const returnSincePrevBlock = (currentValue - previousValue) / previousValue;
  const days = blockDelta / nbrBlocksInDay;
  const yearlyRoi = 100 * ((1 + returnSincePrevBlock) ** (365 / days) - 1);
  return yearlyRoi;
};

const getVirtualPrice = async (address, block) => {
  const poolContract = new archiveNodeWeb3.eth.Contract(poolABI, address);
  const virtualPrice = await poolContract.methods
    .get_virtual_price()
    .call(undefined, block);
  return virtualPrice;
};

module.exports.getVirtualPrice = getVirtualPrice;

const getPricePerFullShare = async (
  vaultContract,
  block,
  inceptionBlockNbr,
) => {
  const contractDidntExist = block < inceptionBlockNbr;
  const inceptionBlock = block === inceptionBlockNbr;
  if (inceptionBlock) {
    return 1e18;
  }
  if (contractDidntExist) {
    return 0;
  }
  const pricePerFullShare = await vaultContract.methods
    .getPricePerFullShare()
    .call(undefined, block);
  return pricePerFullShare;
};

const getApyForVault = async (vault) => {
  const {
    lastMeasurement: inceptionBlockNbr,
    vaultContractABI: abi,
    vaultContractAddress: address,
    symbol,
  } = vault;

  const pool = _.find(pools, { symbol });

  const vaultContract = new archiveNodeWeb3.eth.Contract(abi, address);

  const pricePerFullShareInception = await getPricePerFullShare(
    vaultContract,
    inceptionBlockNbr,
    inceptionBlockNbr,
  );

  const pricePerFullShareCurrent = await getPricePerFullShare(
    vaultContract,
    currentBlockNbr,
    inceptionBlockNbr,
  );

  const pricePerFullShareOneDayAgo = await getPricePerFullShare(
    vaultContract,
    oneDayAgoBlock,
    inceptionBlockNbr,
  );

  const pricePerFullShareThreeDaysAgo = await getPricePerFullShare(
    vaultContract,
    threeDaysAgoBlock,
    inceptionBlockNbr,
  );

  const pricePerFullShareOneWeekAgo = await getPricePerFullShare(
    vaultContract,
    oneWeekAgoBlock,
    inceptionBlockNbr,
  );

  const pricePerFullShareOneMonthAgo = await getPricePerFullShare(
    vaultContract,
    oneMonthAgoBlock,
    inceptionBlockNbr,
  );

  const apyInceptionSample = await getApy(
    pricePerFullShareInception,
    pricePerFullShareCurrent,
    inceptionBlockNbr,
    currentBlockNbr,
  );

  const apyOneDaySample =
    (await getApy(
      pricePerFullShareOneDayAgo,
      pricePerFullShareCurrent,
      oneDayAgoBlock,
      currentBlockNbr,
    )) || apyInceptionSample;

  const apyThreeDaySample =
    (await getApy(
      pricePerFullShareThreeDaysAgo,
      pricePerFullShareCurrent,
      threeDaysAgoBlock,
      currentBlockNbr,
    )) || apyInceptionSample;

  const apyOneWeekSample =
    (await getApy(
      pricePerFullShareOneWeekAgo,
      pricePerFullShareCurrent,
      oneWeekAgoBlock,
      currentBlockNbr,
    )) || apyInceptionSample;

  const apyOneMonthSample =
    (await getApy(
      pricePerFullShareOneMonthAgo,
      pricePerFullShareCurrent,
      oneMonthAgoBlock,
      currentBlockNbr,
    )) || apyInceptionSample;

  let apyLoanscan = apyOneMonthSample;

  const apyData = {
    apyInceptionSample,
    apyOneDaySample,
    apyThreeDaySample,
    apyOneWeekSample,
    apyOneMonthSample,
  };

  if (pool) {
    const poolAddress = pool.address;
    const virtualPriceCurrent = await getVirtualPrice(
      poolAddress,
      currentBlockNbr,
    );
    const virtualPriceOneMonthAgo = await getVirtualPrice(
      poolAddress,
      oneMonthAgoBlock,
    );

    const poolApy = await getApy(
      virtualPriceOneMonthAgo,
      virtualPriceCurrent,
      oneMonthAgoBlock,
      currentBlockNbr,
    );

    const poolPct = poolApy / 100;
    const vaultPct = apyOneMonthSample / 100;
    apyLoanscan = ((1 + poolPct) * (1 + vaultPct) - 1) * 100;
    console.log('set to2', apyLoanscan, address);

    return { ...apyData, poolApy, apyLoanscan };
  }

  return {
    ...apyData,
    apyLoanscan,
  };
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
  } = vault;
  console.log(`Reading vault ${vault.name}`);
  if (!abi || !address) {
    console.log(`Vault ABI not found: ${name}`);
    return null;
  }
  const apy = await getApyForVault(vault);
  const boost = await getBoost(vault);
  console.log('Vault: ', name, apy);
  const data = {
    address,
    name,
    symbol,
    description,
    vaultSymbol,
    tokenAddress,
    timestamp: Date.now(),
    ...apy,
    boost,
  };
  await saveVault(data);
  return data;
};

module.exports.handler = handler(async () => {
  console.log('Fetching historical blocks');
  currentBlockNbr = await infuraWeb3.eth.getBlockNumber();
  oneDayAgoBlock = (await blocks.getDate(oneDayAgo)).block;
  threeDaysAgoBlock = (await blocks.getDate(threeDaysAgo)).block;
  oneWeekAgoBlock = (await blocks.getDate(oneWeekAgo)).block;
  oneMonthAgoBlock = (await blocks.getDate(oneMonthAgo)).block;
  nbrBlocksInDay = currentBlockNbr - oneDayAgoBlock;
  console.log('Done fetching historical blocks');

  const vaultsWithApy = [];
  for (const vault of vaults) {
    const vaultWithApy = await readVault(vault);
    if (vaultWithApy !== null) {
      vaultsWithApy.push(vaultWithApy);
    }
  }

  return vaultsWithApy;
});
