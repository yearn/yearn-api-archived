'use strict';

const Web3 = require('web3');

const web3 = new Web3(process.env.WEB3_ENDPOINT_HTTPS);
const yRegistryAddress = '0x3ee41c098f9666ed2ea246f4d2558010e59d63a0';
const yRegistryAbi = require('../../../../abi/yRegistry.json');
const strategyMinABI = require('../../../../abi/strategyMinABI.json');
const _ = require('lodash');

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

const getVaultsStrategy = async (vault) => {
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

const getPoolTotalSupply = async (poolAddress) => {
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
          type: 'uint256',
        },
      ],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
  ];
  const poolContract = new web3.eth.Contract(earnMinABI, earn.address);
  const _totalHoldings =
    (await poolContract.methods.calcPoolValueInToken().call()) /
    Math.pow(10, earn.decimals);
  const earnHoldings = {
    address: earn.address,
    symbol: earn.symbol,
    name: earn.name,
    timestamp: Date.now(),
    poolBalanceUSD: _totalHoldings,
  };

  return earnHoldings;
};

const getHoldings = async (vault) => {
  const strategyAddress = await getVaultsStrategy(vault);
  const strategyContract = await new web3.eth.Contract(
    strategyMinABI,
    strategyAddress,
  );
  const vaultContract = await new web3.eth.Contract(
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
  const holdings = {
    strategyAddress,
    vaultHoldings,
    strategyHoldings,
  };

  return holdings;
};

module.exports = { getHoldings, getPoolTotalSupply, getEarnHoldings };
