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
    '0x19D3364A399d251E894aC732651be8B0E4e85001',
    '0x5f18C75AbDAe578b483E5F43f12a39cF75b973a9',
    '0xe11ba472F74869176652C35D30dB89854b5ae84D',
  ];
};

module.exports.fetchAddresses = fetchAddresses;

const abi = () => vaultAbi;

module.exports.abi = abi;
