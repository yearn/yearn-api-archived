'use strict';

const Web3 = require('web3');

const web3 = new Web3(process.env.ARCHIVENODE_ENDPOINT);

const ABI_MAP = {
  v1: require('../../../../abi/vaultV1.json'),
  v2: require('../../../../abi/vaultV2.json'),
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
) => {
  const pricePerFullShareDelta = (currentValue - previousValue) / 1e18;
  const blockDelta = currentBlock - previousBlock;
  const dailyRoi = (pricePerFullShareDelta / blockDelta) * 100 * blocksPerDay;
  const yearlyRoi = dailyRoi * 365;
  return yearlyRoi;
};

module.exports.getVaultApy = async (vault, blockStats) => {
  const { currentBlock, oneMonthAgoBlock, blocksPerDay } = blockStats;
  const { inceptionBlock, address } = vault;

  const vaultContract = new web3.eth.Contract(ABI_MAP[vault.type], address);
  const pricePerShare = vaultContract.methods[PPFS_MAP[vault.type]];

  const timeframes = [
    {
      name: 'inceptionSample',
      block: inceptionBlock,
      price: 1e18,
    },
    {
      name: 'oneMonthSample',
      block: oneMonthAgoBlock,
    },
  ];

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
      await Promise.all(
        timeframes.map(async (current, i) => {
          try {
            const prev = i > 0 ? timeframes[i - 1] : null;
            current.price =
              current.price ||
              (await getPrice(current.block, prev ? prev.price : 1e18));
            const roi = calculateYearlyRoi(
              current.price,
              currentPricePerFullShare,
              current.block,
              currentBlock,
              blocksPerDay,
            );
            return [current.name, roi];
          } catch {
            return [current.name, null];
          }
        }),
      ),
    );
  } catch {
    return Object.fromEntries(timeframes.map(({ name }) => [name, null]));
  }
};
