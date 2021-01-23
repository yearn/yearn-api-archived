'use strict';

const Web3 = require('web3');
const yRegistryAbi = require('../../../../abi/yRegistry.json');
const strategyMinABI = require('../../../../abi/strategyMinABI');
const gaugeABI = require('../../../../abi/gauge');
const votingEscrowABI = require('../../../../abi/votingEscrow');
const _ = require('lodash');

const yRegistryAddress = '0x3ee41c098f9666ed2ea246f4d2558010e59d63a0';
const web3 = new Web3(process.env.WEB3_ENDPOINT_HTTPS);

const vaultStrategyMap = {};
const votingEscrowAddress = '0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2';
const votingEscrowContract = new web3.eth.Contract(
  votingEscrowABI,
  votingEscrowAddress,
);

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

module.exports.getBoost = async (vault) => {
  const strategyAddress = await getVaultsStrategy(vault);
  const strategyContract = new web3.eth.Contract(
    strategyMinABI,
    strategyAddress,
  );

  // Rather than update the API with every new strategy ABI to determine whether it references a gauge,
  // we just attempt the call the gauge method and if it fails, it means this strategy does not have the method.
  let gaugeAddress;
  let gaugeContract;
  try {
    gaugeAddress = await strategyContract.methods.gauge().call();
    gaugeContract = new web3.eth.Contract(gaugeABI, gaugeAddress);
  } catch (e) {
    // Strategy has no gauge address, so no boost.
    return null;
  }

  const voterAddress = await strategyContract.methods.voter().call();

  // Calculation code ported from
  // https://github.com/iearn-finance/yearn-exporter/blob/983fbd4ab4436af1f83b88f887c4b50da31482d8/yearn/curve.py#L12
  const gaugeBalance =
    (await gaugeContract.methods.balanceOf(voterAddress).call()) / 1e18;
  const gaugeTotal = (await gaugeContract.methods.totalSupply().call()) / 1e18;
  const workingBalance =
    (await gaugeContract.methods.working_balances(voterAddress).call()) / 1e18;
  const workingSupply =
    (await gaugeContract.methods.working_supply().call()) / 1e18;
  const vecrvBalance =
    (await votingEscrowContract.methods.balanceOf(voterAddress).call()) / 1e18;
  const vecrvTotal =
    (await votingEscrowContract.methods.totalSupply().call()) / 1e18;
  const boost = (workingBalance / gaugeBalance) * 2.5;

  const minVecrv = (vecrvTotal * gaugeBalance) / gaugeTotal;
  let lim = gaugeBalance * 0.4 + ((gaugeTotal * minVecrv) / vecrvTotal) * 0.6;
  lim = Math.min(gaugeBalance, lim);

  const _workingSupply = workingSupply + lim - workingBalance;
  const noboostLim = gaugeBalance * 0.4;
  const noboostSupply = workingSupply + noboostLim - workingBalance;
  const maxBoostPossible = lim / _workingSupply / (noboostLim / noboostSupply);

  return {
    gaugeBalance,
    gaugeTotal,
    vecrvBalance,
    vecrvTotal,
    workingBalance,
    workingTotal: workingSupply,
    boost,
    maxBoost: maxBoostPossible,
    minVecrv,
  };
};
