const dynamodb = require('../../utils/dynamodb');
const db = dynamodb.doc;
const _ = require("lodash");
const { injectDataIntoVaultAtKey } = require("../../utils/vaults");
const { getVaultsApy } = require("../vaults/apy/handler");

const getVaults = async () => {
  const params = {
    TableName: "vaults",
  };
  const entries = await db.scan(params).promise();
  const vaults = entries.Items;
  return vaults;
};

exports.getVaults = getVaults;

exports.handler = async (event) => {
  const allVaults = await getVaults();
  const queryParams = event.queryStringParameters;
  const showApy = _.get(queryParams, "apy") === "true";

  // Inject APY into vaults
  const apy = showApy && (await getVaultsApy());
  const injectApy = (vault) => {
    const newVault = injectDataIntoVaultAtKey(vault, apy, "apy");
    return newVault;
  };

  const vaultsWithData = _.chain(allVaults).map(injectApy);

  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify(vaultsWithData),
  };
  return response;
};
