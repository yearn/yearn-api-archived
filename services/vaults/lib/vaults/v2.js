'use strict';

// const _ = require('lodash');
// const fetch = require('node-fetch');
const vaultAbi = require('../../../../abi/vaults/yvault_v1.json');

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
    '0xe2F6b9773BF3A015E2aA70741Bde1498bdB9425b',
    '0xBFa4D8AA6d8a379aBFe7793399D3DdaCC5bBECBB',
    '0x27Eb83254D900AB4F9b15d5652d913963FeC35e3',
    '0xFeD651936Af7e98F7F2A93c03B1E28a2DA7dfaD4',
    '0x19db27D2E9E4B780CF9A296D575aBbddEe1578DA',
    '0xca6c9fb742071044247298ea0dbd60b77586e1e8',
    '0x20Eb2A369b71C29FC4aFCddBbc1CAB66CCfcB062',
    '0x6392e8fa0588CB2DCb7aF557FdC9D10FDe48A325',
  ];
};

module.exports.fetchAddresses = fetchAddresses;

const abi = () => vaultAbi;

module.exports.abi = abi;
