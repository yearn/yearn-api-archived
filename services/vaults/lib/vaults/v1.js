'use strict';

const Web3 = require('web3');
const yRegistryAbi = require('../../../../abi/yRegistry.json');
const vaultAbi = require('../../../../abi/vaultV1.json');

const yRegistryAddress = '0x3ee41c098f9666ed2ea246f4d2558010e59d63a0';
const web3 = new Web3(process.env.WEB3_ENDPOINT);

// FetchAddresses of all V1 vaults from yRegistry
const fetchAddresses = async () => {
  const registryContract = new web3.eth.Contract(
    yRegistryAbi,
    yRegistryAddress,
  );
  return await registryContract.methods.getVaults().call();
};

module.exports.fetchAddresses = fetchAddresses;

const abi = () => vaultAbi;

module.exports.abi = abi;
