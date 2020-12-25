'use strict';

const fetch = require('node-fetch');

const GHRAW = 'https://raw.githubusercontent.com';
const GHAPI = 'https://api.github.com/repos';

const ALIASES = `${GHRAW}/iearn-finance/yearn-assets/master/icons/aliases.json`;

const YEARN_ASSETS = `${GHAPI}/iearn-finance/yearn-assets/contents/icons/tokens`;
const yearnAssetUrl = (address) =>
  `${GHRAW}/iearn-finance/yearn-assets/master/icons/tokens/${address}/logo-128.png`;

const TRUST_ASSETS = `${GHRAW}/trustwallet/assets/master/blockchains/ethereum/tokenlist.json`;

module.exports.fetchAliases = async () => {
  const aliases = await fetch(ALIASES).then((res) => res.json());
  return Object.fromEntries(
    aliases.map((alias) => [alias.address, alias.name]),
  );
};

const fetchYearnAssets = async () => {
  const assets = await fetch(YEARN_ASSETS).then((res) => res.json());
  return Object.fromEntries(
    assets.map(({ name: address }) => [address, yearnAssetUrl(address)]),
  );
};

const fetchTrustAssets = async () => {
  const { tokens } = await fetch(TRUST_ASSETS).then((res) => res.json());
  return Object.fromEntries(
    tokens.map(({ address, logoURI }) => [address, logoURI]),
  );
};

module.exports.fetchAssets = async () => {
  const yearnAssets = await fetchYearnAssets();
  const trustAssets = await fetchTrustAssets();
  return { ...trustAssets, ...yearnAssets };
};
