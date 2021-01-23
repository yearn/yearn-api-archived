# Yearn TVL Calculation Methodology

## Overview- Calculating Totals, Avoiding Double-Counting

- **Total Earn Holdings**
  - Sum up all individual iEarn contracts in USD, which can be found [here](https://docs.yearn.finance/developers/deployed-contracts-registry).
    - These are yWBTC, ySUSD, yTUSD, yBUSD, and two versions each of yUSDC, yUSDT, and yDAI.
  - Using individual contracts is more accurate than using Curve pools because users can directly deposit into contracts.
- **Total Strategy Holdings**
  - Sum up Strategy Holdings in USD.
  - Subtract WETH, TUSD, and DAI Strategy Holdings since these are all delegated to yCRV.
  - Subtract USDT, USDC, and aLINK strategy since they all feed to 3pool. LINK doesn't have a separate strategy.
  - Subtract mUSD Strategy Holdings since these are in the mUSD3crv vault.
- **Total Vault Holdings**
  - Sum up Vault Holdings in USD.
  - Subtract Strategy Holdings for EURS, ETH, DAI, and TUSD since all are in yCRV Vault.
  - Subtract Strategy Holdings for aLINK, USDC, and USDT and subtract Vault Holdings for LINK since these are all in the 3pool Vault.
  - Subtract mUSD Strategy Holdings since these are in the mUSD3crv vault.
- **Total Value Locked**
  - Start with Total Vault Holdings.
  - Add Total Earn Holdings.
  - Add YFI Staking and Yearn's veCRV.
  - Subtract Vault Holdings for yCRV and crvBUSD since these are included in Earn.
  - Subtract YFI Vault Holdings since this is included in staking.

## Directions for API

### Prices on-chain from Uniquote

Prices for volatile assets are currently pulled from CoinGecko's API, but will be upgraded to use data from Uniquote soon.

Oracle contract: https://etherscan.io/address/0x73353801921417f465377c8d898c6f4c0270282c#readContract

To calculate prices for volatile assets, simply call `current`, and provide the token, amount, and base token. For WETH, this is WETH/USDC, and for all other tokens it is token/WETH. Note that WETH, YFI, LINK, and CRV have 18 decimals, USDC has 6, and WBTC has 8.

**WETH:** `current(0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2, 1000000000000000000, 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)/1e6`

**WBTC:** `current(0x2260fac5e5542a773aa44fbcfedf7c193bc2c599, 100000000, 0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2)/1e18 * WETH`

**YFI:** `current(0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e, 1000000000000000000, 0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2)/1e18 * WETH`

**CRV:** `current(0xd533a949740bb3306d119cc777fa900ba034cd52, 1000000000000000000, 0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2)/1e18 * WETH`

**LINK:** `current(0x514910771af9ca656af840dff83e8264ecf986ca, 1000000000000000000, 0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2)/1e18 * WETH`

### Curve Pool Prices

For all Curve Pools, price can be queried directly from the contract by calling `get_virtual_price`

Compound Pool

- Contract `0xA2B47E3D5c44877cca798226B7B8118F9BFb7A56`

3pool

- Contract `0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7`

Y Pool

- Contract `0x45F783CCE6B7FF23B2ab2D70e416cdb7D6055f51`

BUSD Pool

- Contract `0x79a8C46DeA5aDa233ABaFFD40F3A0A2B1e5A4F27`

sBTC Pool

- Contract `0x7fC77b5c7614E1533320Ea6DDc2Eb61fa00A9714`

mUSD Pool

- Contract `0x1AEf73d49Dedc4b1778d0706583995958Dc862e6`

GUSD Pool

- Contract `0x8474DdbE98F5aA3179B3B3F5942D724aFcdec9f6`

EURS Pool

- Contract `0x0Ce6a5fF5217e38315f87032CF90686C96627CAA`

### Non-Stablecoin yVault Contracts

**Order**
Compound Pool
3pool
Y Pool
BUSD Pool
sBTC Pool
mUSD Pool
GUSD Pool
YFI
aLINK
WETH
LINK (no strategy)
eursCRV pool

**Vaults, 12 total**
0x629c759D1E83eFbF63d84eb3868B564d9521C129
0x9cA85572E6A3EbF24dEDd195623F188735A5179f
0x5dbcF33D8c2E976c6b560249878e6F1491Bca25c
0x2994529C0652D127b7842094103715ec5299bBed
0x7Ff566E1d69DEfF32a7b244aE7276b9f90e9D0f6
0x0FCDAeDFb8A7DfDa2e9838564c5A1665d856AFDF
0xcC7E70A958917cCe67B4B87a8C30E6297451aE98
0xBA2E7Fed597fd0E3e70f5130BcDbbFE06bB94fe1
0x29E240CFD7946BA20895a7a02eDb25C210f9f324
0xe1237aA7f535b0CC33Fd973D66cBf830354D16c7
0x881b06da56BB5675c54E4Ed311c21E54C5025298
0x98B058b2CBacF5E99bC7012DF757ea7CFEbd35BC

Read `balance`, then multiply by `get_virtual_price` for Curve pools, and by price from Uniquote for everything else. For sBTC pool read `balance`, then multiply by `get_virtual_price` for Curve pools, and then by price from Uniquote for WBTC.

**Strategies, 11 total**
0x530da5aeF3c8f9CCbc75C97C182D6ee2284B643F
0xC59601F0CC49baa266891b7fc63d2D5FE097A79D
0x07DB4B9b3951094B9E278D336aDf46a036295DE7
0x112570655b32A8c747845E0215ad139661e66E7F
0x6D6c1AD13A5000148Aa087E7CbFb53D402c81341
0xBA0c07BBE9C22a1ee33FE988Ea3763f21D0909a0
0xD42eC70A590C6bc11e9995314fdbA45B4f74FABb
0x395F93350D5102B6139Abfc84a7D6ee70488797C
0x25fAcA21dd2Ad7eDB3a027d543e617496820d8d6
0x932fc4fd0eEe66F22f1E23fBA74D7058391c0b15
0x22422825e2dFf23f645b04A3f89190B69f174659

Read `balanceOf`, then multiply by `get_virtual_price` for Curve pools, and by price from Uniquote for everything else. For sBTC pool read `balanceOf`, then multiply by `get_virtual_price` for Curve pools, and then by price from Uniquote for WBTC.

### Stablecoin yVault Contracts

**Order**
DAI
TUSD
USDC
USDT
GUSD
mUSD

All prices are assumed to be equal to 1 USD. USDC and USDT have 6 decimals, GUSD has 2.

**Vaults, 6 total**
0xACd43E627e64355f1861cEC6d3a6688B31a6F952
0x37d19d1c4E1fa9DC47bD1eA12f742a0887eDa74a
0x597aD1e0c13Bfe8025993D9e79C69E1c0233522e
0x2f08119C6f07c006695E079AAFc638b8789FAf18
0xec0d8D3ED5477106c6D4ea27D90a60e594693C90
0xE0db48B4F71752C4bEf16De1DBD042B82976b8C7

For all of these, read `balance`, no need to multiply by anything.

**Strategies, 6 total**
0xAa880345A3147a1fC6889080401C791813ed08Dc
0xe3a711987612BFD1DAFa076506f3793c78D81558
0x4720515963A9d40ca10B1aDE806C1291E6c9A86d
0xc7e437033D849474074429Cbe8077c971Ea2a852
0xc8327D8E1094a94466e05a2CC1f10fA70a1dF119
0x6f1EbF5BBc5e32fffB6B3d237C3564C15134B8cF

For all of these, read `balanceOf`, no need to multiply by anything.

### Staking Contracts

YFI
0xBa37B002AbaFDd8E89a1995dA52740bbC013D992

For this, read `totalSupply`, then multiply by price from Uniquote.

### Earn Contracts

**v2 Stablecoins**
yDAI v2
yUSDC v2
yUSDT v2
yTUSD v2
ySUSD v2

0x16de59092dAE5CcF4A1E6439D611fd0653f0Bd01
0xd6aD7a6750A7593E092a9B218d66C0A814a3436e
0x83f798e925BcD4017Eb265844FDDAbb448f1707D
0x73a052500105205d34daf004eab301916da8190f
0xF61718057901F84C4eEC4339EF8f0D86D2B45600

Read `calcPoolValueInToken`. Note that USDT and USDC have 6 decimals.

**v3 Stablecoins**
yDAI v3
yUSDC v3
yUSDT v3
yBUSD v3

0xC2cB1040220768554cf699b0d863A3cd4324ce32
0x26EA744E5B887E5205727f55dFBE8685e3b21951
0xE6354ed5bC4b393a5Aad09f21c46E101e692d447
0x04bC0Ab673d88aE9dbC9DA2380cB6B79C4BCa9aE

Read `calcPoolValueInToken`. Note that USDT and USDC have 6 decimals.

**yWBTC**

0x04Aa51bbcB46541455cCF1B8bef2ebc5d3787EC9

Read `calcPoolValueInToken`, (for yWBTC this has 8 decimals), and multiply by the WBTC price from Uniquote.

### Yearn veCRV

veCRV contract
0x5f3b5dfeb7b28cdbd7faba78963ee202a494e2a2

- Call `balanceOf`
- Enter Yearn veCRV voter address (0xF147b8125d2ef93FB6965Db97D6746952a133934)
- Multiply by CRV price from Uniquote

### Totals

**Total Strategy Holdings**
Sum up all strategy holdings.
Subtract `dai_strategy`
Subtract `weth_strategy`
Subtract `tusd_strategy`
Subtract `alink_strategy`
Subtract `usdt_strategy`
Subtract `usdc_strategy`
Subtract `musd_strategy`

Resultant is `total_strategy_holdings`

**Total Vault Holdings**
Sum up all vault holdings.
Subtract `dai_strategy`
Subtract `weth_strategy`
Subtract `tusd_strategy`
Subtract `alink_strategy`
Subtract `usdt_strategy`
Subtract `usdc_strategy`
Subtract `link_vault`
Subtract `musd_strategy`

Resultant is `total_vault_holdings`

**Total Earn Holdings**
Sum up all earn holdings, 9 stablecoins and WBTC.

Resultant is `total_earn_holdings`

**Total Value Locked**
Start with `total_vault_holdings`
Add `total_earn_holdings`
Add `yfi_staking`
Add `yearn_veCRV`
Subtract `yfi_vault`
Subtract `curve_y_vault`
Subtract `curve_busd_vault`
