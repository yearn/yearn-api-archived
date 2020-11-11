'use strict';

const vaultContractABI = require('./abis/vaultV1');
const vaultContractV2ABI = require('./abis/vaultV2');
const vaultContractV3ABI = require('./abis/vaultV3');
const vaultContractV4ABI = require('./abis/vaultV4');
const vaultContractV5ABI = require('./abis/vaultV5');

module.exports = {
  delayTime: 1000,
  vaultContractABI,
  vaultContractV2ABI,
  vaultContractV3ABI,
  vaultContractV4ABI,
  vaultContractV5ABI,
};
