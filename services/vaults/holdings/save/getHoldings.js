'use strict';

const Web3 = require('web3');

const web3 = new Web3(process.env.WEB3_ENDPOINT);
const yRegistryAddress = '0x3ee41c098f9666ed2ea246f4d2558010e59d63a0';
const yRegistryAbi = require('../../../../abi/yRegistry.json');
const strategyMinABI = require('../../../../abi/strategyMinABI.json');
const _ = require('lodash');


const infuraUrl = process.env.WEB3_ENDPOINT;
const infuraWeb3 = new Web3(infuraUrl);
const delay = require('delay');
const { delayTime } = require('./config');

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


const getHoldings = async vault => {
  let holdings;
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

module.exports = { getHoldings };
