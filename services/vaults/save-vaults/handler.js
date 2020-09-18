require("dotenv").config();
const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10" });
const _ = require("lodash");
const fetch = require("node-fetch");
const Web3 = require("web3");
const web3 = new Web3(process.env.WEB3_ENDPOINT);
const etherscanApiKey = process.env.ETHERSCAN_API_KEY;
const yRegistryAbi = require("./abis/yRegistry");
const yRegistryAddress = "0x3ee41c098f9666ed2ea246f4d2558010e59d63a0";
const delay = require("delay");
const delayTime = 100;

const fetchContractMetadata = async (address) => {
	const url = `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${address}&apikey=${etherscanApiKey}`;
	const resp = await fetch(url).then((res) => res.json());
	const metadata = resp.result[0];
	await delay(delayTime);
	return metadata;
};

const fetchContractName = async (address) => {
	const metadata = await fetchContractMetadata(address);
	const contractName = metadata.ContractName;
	return contractName;
};

const fetchAbi = async (address) => {
	const url = `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${etherscanApiKey}`;
	const resp = await fetch(url).then((res) => res.json());
	const abi = JSON.parse(resp.result);
	await delay(delayTime);
	return abi;
};

const getContract = async (address) => {
	const abi = await fetchAbi(address);
	const contract = new web3.eth.Contract(abi, address);
	await delay(delayTime);
	return contract;
};

const callContractMethod = async (contract, method) => {
	try {
		const result = await contract.methods[method]().call();
		await delay(delayTime);
		return result;
	} catch (err) {
		console.log("err", method);
	}
};

const saveVault = async (vault) => {
	const params = {
		TableName: "vaults",
		Item: vault,
	};
	await db
		.put(params)
		.promise()
		.catch((err) => console.log("err", err));
	console.log(`Saved ${vault.name}`);
};

module.exports.handler = async (event) => {
	const registryContract = new web3.eth.Contract(
		yRegistryAbi,
		yRegistryAddress
	);
	const vaultAddresses = await registryContract.methods.getVaults().call();
	await delay(delayTime);

	const vaultInfo = await registryContract.methods.getVaultsInfo().call();
	await delay(delayTime);

	const getVault = async (vaultAddress, idx) => {
		const vault = {};
		const controllerAddress = vaultInfo.controllerArray[idx];
		const strategyAddress = vaultInfo.strategyArray[idx];
		const vaultContract = await getContract(vaultAddress);
		const controllerContract = await getContract(controllerAddress);
		const strategyContract = await getContract(strategyAddress);
		const vaultName = await callContractMethod(vaultContract, "name");
		const vaultSymbol = await callContractMethod(vaultContract, "symbol");
		const tokenSymbol = vaultSymbol.substring(1);
		const tokenAddress = vaultInfo.tokenArray[idx];
		const tokenName =
			tokenSymbol === "USDC" ? "USD Coin" : _.trimStart(vaultName, "yearn ");
		const decimals = parseInt(
			await callContractMethod(vaultContract, "decimals"),
			10
		);
		const tokenInfo = await fetch(
			`https://api.coingecko.com/api/v3/coins/ethereum/contract/${tokenAddress}`
		).then((res) => res.json());
		const tokenIcon = tokenInfo.image.small;

		vault.address = vaultAddress;
		vault.name = vaultName;
		vault.symbol = vaultSymbol;
		vault.controllerAddress = controllerAddress;
		vault.controllerName = await fetchContractName(controllerAddress);
		vault.strategyAddress = strategyAddress;
		vault.strategyName = await fetchContractName(strategyAddress);
		vault.tokenAddress = tokenAddress;
		vault.tokenName = tokenName;
		vault.tokenSymbol = tokenSymbol;
		vault.tokenIcon = tokenIcon;
		vault.decimals = decimals;
		vault.wrapped = vaultInfo.isWrappedArray[idx];
		vault.delegated = vaultInfo.isDelegatedArray[idx];

		await saveVault(vault);
		return vault;
	};

	const vaults = [];
	let idx = 0;
	const nbrVaults = _.size(vaultAddresses);
	for (idx = 0; idx < nbrVaults; idx++) {
		const vaultAddress = vaultAddresses[idx];
		const vault = await getVault(vaultAddress, idx);
		vaults.push(vault);
	}

	const response = {
		statusCode: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Credentials": true,
		},
		body: JSON.stringify(vaults),
	};
	return response;
};
