'use strict';

const Web3 = require('web3');

const web3 = new Web3(process.env.WEB3_ENDPOINT);
const yRegistryAddress = '0x3ee41c098f9666ed2ea246f4d2558010e59d63a0';
const yRegistryAbi = require('../../../../abi/yRegistry.json');
const strategyMinABI = require('../../../../abi/strategyMinABI.json');
const _ = require('lodash');
const getVirtualPrice = require('../../apy/save/handler');

const infuraUrl = process.env.WEB3_ENDPOINT;
const infuraWeb3 = new Web3(infuraUrl);
const delay = require('delay');
const { delayTime } = require('./config');

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

const vaultStrategyMap = {};

const getVaultsStrategy = async vault => {
  // Populate vault->strategy mapping if first time here to reuse of future calls.
  if (_.isEmpty(vaultStrategyMap)) {
    const registryContract = new web3.eth.Contract(
      yRegistryAbi,
      yRegistryAddress,
    );

    const vaultAddresses = await registryContract.methods.getVaults().call();
    const vaultsInfo = await registryContract.methods.getVaultsInfo().call();

    vaultAddresses.forEach((address, index) => {
      vaultStrategyMap[address] = vaultsInfo.strategyArray[index];
    });
  }

  return vaultStrategyMap[vault.vaultContractAddress];
};

const getPoolTotalSupply = async poolAddress => {
  const poolContract = new web3.eth.Contract(poolMinABI, poolAddress);
  const _totalSupply = (await poolContract.methods.totalSupply().call()) / 1e18;
  return _totalSupply;
};

const getEarnHoldings = async (earn) => {
  const earnMinABI = [
    {
      constant: true,
      inputs: [],
      name: 'calcPoolValueInToken',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256'
        }
      ],
      payable: false,
      stateMutability: 'view',
      type: 'function'
    }
  ];
  const poolContract = new web3.eth.Contract(earnMinABI, earn.address);
  const _totalHoldings = (await poolContract.methods.calcPoolValueInToken().call()) / Math.pow(10,earn.decimals);
  const earnHoldings = {
    address: earn.address,
    symbol: earn.symbol,
    name: earn.name,
    timestamp: Date.now(),
    poolBalanceUSD:_totalHoldings
  };
  /* await saveVault(earnHoldings); */
  return earnHoldings;
}

const getHoldings = async vault => {
  let holdings;
  const { symbol, erc20address } = vault;
  const strategyAddress = await getVaultsStrategy(vault);
  const strategyContract = new web3.eth.Contract(
    strategyMinABI,
    strategyAddress,
  );
  const vaultContract = new web3.eth.Contract(
    vault.vaultContractABI,
    vault.vaultContractAddress,
  );
  const vaultHoldings =
    (await vaultContract.methods.balance().call()) /
    Math.pow(10, vault.decimals);
  const strategyHoldings =
    (await strategyContract.methods.balanceOf().call()) /
    Math.pow(
      10,
      vault.strategyDecimals ? vault.strategyDecimals : vault.decimals,
    );
    holdings = {
      strategyAddress,
      vaultHoldings,
      strategyHoldings,
    };

  return holdings;
};

module.exports = { getHoldings, getPoolTotalSupply, getEarnHoldings };
