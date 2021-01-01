'use strict';

const fetch = require('node-fetch');

const GHRAW_URL = 'https://raw.githubusercontent.com';
const GHAPI_URL = 'https://api.github.com/repos';

const ALIASES_URL = `${GHRAW_URL}/iearn-finance/yearn-assets/master/icons/aliases.json`;

const YEARN_ASSETS_URL = `${GHAPI_URL}/iearn-finance/yearn-assets/contents/icons/tokens`;
const yearnAssetUrl = (address) =>
  `${GHRAW_URL}/iearn-finance/yearn-assets/master/icons/tokens/${address}/logo-128.png`;

const TRUST_ASSETS_URL = `${GHRAW_URL}/trustwallet/assets/master/blockchains/ethereum/tokenlist.json`;

module.exports.fetchSymbolAliases = async () => {
  const aliases = await fetch(ALIASES_URL).then((res) => res.json());
  return Object.fromEntries(
    aliases.map((alias) => [alias.address, alias.symbol]),
  );
};

const fetchYearnAssets = async () => {
  const assets = await fetch(YEARN_ASSETS_URL).then((res) => res.json());
  return Object.fromEntries(
    assets.map(({ name: address }) => [address, yearnAssetUrl(address)]),
  );
};

const fetchTrustAssets = async () => {
  const { tokens } = await fetch(TRUST_ASSETS_URL).then((res) => res.json());
  return Object.fromEntries(
    tokens.map(({ address, logoURI }) => [address, logoURI]),
  );
};

module.exports.fetchAssets = async () => {
  const yearnAssets = await fetchYearnAssets();
  const trustAssets = await fetchTrustAssets();
  return { ...trustAssets, ...yearnAssets };
};
