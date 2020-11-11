// Until we have vault registry, hardcoding vault metadata to save many contract queries on every call.
const vaultsConfig = [
  {
    name: 'USD Coin',
    address: '0x597aD1e0c13Bfe8025993D9e79C69E1c0233522e',
    token: {
      name: 'USDC',
      address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      decimals: 6,
    },
  },
  {
    name: 'curve.fi/y LP',
    address: '0x5dbcF33D8c2E976c6b560249878e6F1491Bca25c',
    token: {
      name: 'yCRV',
      address: '0xdf5e0e81dff6faf3a7e52ba697820c5e32d806a8',
      decimals: 18,
    },
  },
  {
    name: 'TUSD',
    address: '0x37d19d1c4E1fa9DC47bD1eA12f742a0887eDa74a',
    token: {
      name: 'TUSD',
      address: '0x0000000000085d4780B73119b644AE5ecd22b376',
      decimals: 18,
    },
  },
  {
    name: 'DAI',
    address: '0xACd43E627e64355f1861cEC6d3a6688B31a6F952',
    token: {
      name: 'DAI',
      address: '0x6b175474e89094c44da98b954eedeac495271d0f',
      decimals: 18,
    },
  },
  {
    name: 'USDT',
    address: '0x2f08119C6f07c006695E079AAFc638b8789FAf18',
    token: {
      name: 'USDT',
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      decimals: 6,
    },
  },
  {
    name: 'yearn.finance',
    address: '0xBA2E7Fed597fd0E3e70f5130BcDbbFE06bB94fe1',
    token: {
      name: 'YFI',
      address: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
      decimals: 18,
    },
  },
  {
    name: 'curve.fi/busd LP',
    address: '0x2994529c0652d127b7842094103715ec5299bbed',
    token: {
      name: 'crvBUSD',
      address: '0x3B3Ac5386837Dc563660FB6a0937DFAa5924333B',
      decimals: 18,
    },
  },
  {
    name: 'curve.fi/sbtc LP',
    address: '0x7Ff566E1d69DEfF32a7b244aE7276b9f90e9D0f6',
    token: {
      name: 'crvBTC',
      address: '0x075b1bb99792c9E1041bA13afEf80C91a1e70fB3',
      decimals: 18,
    },
  },
  {
    name: 'WETH',
    address: '0xe1237aA7f535b0CC33Fd973D66cBf830354D16c7',
    token: {
      name: 'WETH',
      address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      decimals: 18,
    },
  },
  {
    name: 'ChainLink',
    address: '0x881b06da56BB5675c54E4Ed311c21E54C5025298',
    token: {
      name: 'LINK',
      address: '0x514910771af9ca656af840dff83e8264ecf986ca',
      decimals: 18,
    },
  },
  {
    name: 'aLINK',
    address: '0x29E240CFD7946BA20895a7a02eDb25C210f9f324',
    token: {
      name: 'aLINK',
      address: '0xA64BD6C70Cb9051F6A9ba1F163Fdc07E0DfB5F84',
      decimals: 18,
    },
  },
];

module.exports = vaultsConfig;
