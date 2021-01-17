'use strict';

// const _ = require('lodash');
// const fetch = require('node-fetch');
const vaultAbi = require('../../../../abi/vaults/yvault_v2.json');

// const SUBGRAPH_URL =
// 'https://api.thegraph.com/subgraphs/name/salazarguille/yearn-vaults-v2-subgraph-rinkeby';

// FetchAddresses of all V2 vaults from the subgraph
const fetchAddresses = async () => {
  // const query = '{ vaults { id } }';
  // const response = await fetch(SUBGRAPH_URL, {
  //   method: 'POST',
  //   body: JSON.stringify({ query }),
  // }).then((res) => res.json());
  // const { data: { vaults } } = response;
  // return _.map(vaults, vault => vault.id);

  // TODO: hadcoded V2 vaults. This is put in place until a
  // mainnet subgraph endpoint gets deployed.
  return [
    '0x33bd0f9618cf38fea8f7f01e1514ab63b9bde64b',
    '0xFeD651936Af7e98F7F2A93c03B1E28a2DA7dfaD4',
    '0xba81fb02d5e7b94b341e82d1959c372590b852be',
    '0x20Eb2A369b71C29FC4aFCddBbc1CAB66CCfcB062',
    '0x18c447b7Ad755379B8800F1Ef5165E8542946Afd',
    '0xCA6C9fB742071044247298Ea0dBd60b77586e1E8',
    '0x19db27D2E9E4B780CF9A296D575aBbddEe1578DA',
    '0x27Eb83254D900AB4F9b15d5652d913963FeC35e3',
    '0xBFa4D8AA6d8a379aBFe7793399D3DdaCC5bBECBB',
    '0xe2f6b9773bf3a015e2aa70741bde1498bdb9425b',
    // '0x15a2B3CfaFd696e1C783FE99eed168b78a3A371e',
    '0x07dbC20B84fF63F3cc542F6A22E5a71cbA5670A4',
    '0x6392e8fa0588CB2DCb7aF557FdC9D10FDe48A325',
    '0xdCD90C7f6324cfa40d7169ef80b12031770B4325',
  ];
};

module.exports.fetchAddresses = fetchAddresses;

const abi = () => vaultAbi;

module.exports.abi = abi;
