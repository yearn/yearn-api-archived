'use strict';

const Web3 = require('web3');

const web3 = new Web3(process.env.ARCHIVENODE_ENDPOINT);

const v1 = require('./v1');
const v2 = require('./v2');

const ABI_MAP = {
  v1: v1.abi(),
  v2: v2.abi(),
};

const PPFS_MAP = {
  v1: 'getPricePerFullShare',
  v2: 'pricePerShare',
};

module.exports.fetchBlockStats = async () => {
  const blocksPerMinute = 4;
  const blocksPerHour = 60 * blocksPerMinute;
  const blocksPerDay = blocksPerHour * 24;
  const blocksPerMonth = blocksPerDay * 30;
  const currentBlock = await web3.eth.getBlockNumber();
  const oneMonthAgoBlock = currentBlock - blocksPerMonth;
  return {
    blocksPerDay,
    currentBlock,
    oneMonthAgoBlock,
  };
};

const calculateYearlyRoi = (
  previousValue,
  currentValue,
  previousBlock,
  currentBlock,
  blocksPerDay,
  decimals,
) => {
  console.log(`previousValue: ${previousValue}`);
  console.log(`currentValue: ${currentValue}`);
  console.log(`previousBlock: ${previousBlock}`);
  console.log(`currentBlock: ${currentBlock}`);
  console.log(`blocksPerDay: ${blocksPerDay}`);
  console.log(`decimals: ${decimals}`);
  const pricePerFullShareDelta =
    (currentValue - previousValue) / 10 ** decimals;
  console.log(`pricePerFullShareDelta: ${pricePerFullShareDelta}`);
  const blockDelta = currentBlock - previousBlock;
  console.log(`blockDelta: ${blockDelta}`);
  const dailyRoi = (pricePerFullShareDelta / blockDelta) * 100 * blocksPerDay;
  console.log(`dailyRoi: ${dailyRoi}`);
  const yearlyRoi = dailyRoi * 365;
  console.log(`yearlyRoi: ${yearlyRoi}`);
  return yearlyRoi;
};

module.exports.getVaultApy = async (vault, blockStats) => {
  const { currentBlock, oneMonthAgoBlock, blocksPerDay } = blockStats;
  const { inceptionBlock, address } = vault;

  console.log(`address: ${address}`);
  console.log(`inception block: ${inceptionBlock}`);

  const vaultContract = new web3.eth.Contract(ABI_MAP[vault.type], address);
  const pricePerShare = vaultContract.methods[PPFS_MAP[vault.type]];

  console.log(`pricePerShare: ${pricePerShare()}`);

  // v2 vaults `pricePerShare` works in relation to the decimals in the vault
  const decimals =
    vault.type === 'v2' ? parseInt(vault.decimals || '18', 10) : 18;

  console.log(`decimals: ${vault.decimals}`);
  console.log(`inception price: ${10 ** decimals}`);
  const timeframes = [
    {
      name: 'inceptionSample',
      block: inceptionBlock,
      price: 10 ** decimals,
    },
    {
      name: 'oneMonthSample',
      block: oneMonthAgoBlock,
    },
  ];

  console.log(vault.type);

  const getPrice = async (block, fallback) => {
    if (block) {
      return block > inceptionBlock
        ? await pricePerShare().call(undefined, block)
        : fallback;
    }
    return await pricePerShare().call();
  };

  try {
    const currentPricePerFullShare = await getPrice();
    return Object.fromEntries(
      await timeframes
        .map((current, i) => async (entries) => {
          try {
            const prev = i > 0 ? timeframes[i - 1] : null;

            console.log(`previous price: ${prev.price}`);
            // get price in timeframe, falling back to prev price if timeframe
            // is greater then the inception of this vault.
            current.price =
              current.price ||
              (await getPrice(
                current.block,
                prev ? prev.price : 10 ** decimals,
              ));

            const roi = calculateYearlyRoi(
              current.price,
              currentPricePerFullShare,
              current.block,
              currentBlock,
              blocksPerDay,
              decimals,
            );
            entries.push([current.name, roi]);
          } catch (err) {
            console.log(vault, err);
            entries.push([current.name, null]);
          }
          return entries;
        })
        .reduce((p, fn) => p.then(fn), Promise.resolve([])),
    );
  } catch (err) {
    console.log(vault, err);
    return Object.fromEntries(timeframes.map(({ name }) => [name, null]));
  }
};
