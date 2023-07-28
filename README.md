# deploy-v2.1

```
git clone https://github.com/Gearbox-protocol/deploy-v2.1.git
cd deploy-v.2.1
yarn
```

copy .env.example to .env and fill in MAINNET_NODE_URI field

## execute safe queued txs on local fork

`anvil -f https://mainnet.infura.io/v3/... --chain-id 1337`

of

`npx hardhat node`

run scripts in ./scripts folder one by one
`npx hardhat run --network localhost ./scripts/cm-weth/execute.ts`

### Important note !!!

Some scripts do fast-forward of local chain for a few days to pass Timelock ETA requirements.
Several scripts executions can cause chain will have too far blocktime and will not pass Timelock max delay.

So, it's better to restart anvil/hh-node if you need to re-execute txs.

### Important information for contributors

As a contributor to the Gearbox Protocol GitHub repository, your pull requests indicate acceptance of our Gearbox Contribution Agreement. This agreement outlines that you assign the Intellectual Property Rights of your contributions to the Gearbox Foundation. This helps safeguard the Gearbox protocol and ensure the accumulation of its intellectual property. Contributions become part of the repository and may be used for various purposes, including commercial. As recognition for your expertise and work, you receive the opportunity to participate in the protocol's development and the potential to see your work integrated within it. The full Gearbox Contribution Agreement is accessible within the [repository](/ContributionAgreement) for comprehensive understanding. [Let's innovate together!]
