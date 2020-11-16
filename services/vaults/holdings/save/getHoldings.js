const Web3 = require("web3");
const web3 = new Web3(process.env.WEB3_ENDPOINT);
const yRegistryAddress = "0x3ee41c098f9666ed2ea246f4d2558010e59d63a0";
const yRegistryAbi = require("../../../../abi/yRegistry.json");
const strategyMinABI = require("../../../../abi/strategyMinABI.json");
const _ = require("lodash");


let vaultStrategyMap = {};

const getVaultsStrategy = async (vault) => {
  // Populate vault->strategy mapping if first time here to reuse of future calls.
  if (_.isEmpty(vaultStrategyMap)) {
    const registryContract = new web3.eth.Contract(
      yRegistryAbi,
      yRegistryAddress
    );

    const vaultAddresses = await registryContract.methods.getVaults().call();
    const vaultsInfo = await registryContract.methods.getVaultsInfo().call();

    vaultAddresses.forEach((address, index) => {
      vaultStrategyMap[address] = vaultsInfo['strategyArray'][index];
    });
  }

  return vaultStrategyMap[vault.vaultContractAddress];
}


module.exports.getStrategyHoldings = async(vault) => {
    const strategyAddress = await getVaultsStrategy(vault);
    const strategyContract = new web3.eth.Contract(strategyMinABI, strategyAddress);

    const strategyHoldings = await strategyContract.methods.balanceOf.call() / 1e18;
    const strategyName = await strategyContract.methods.getName.call();


    return {
            'name': strategyName,
            'address': strategyAddress,
            'holdings': strategyHoldings
			}        

}