import path from 'path';
import fs from 'fs';
import { HardhatUserConfig } from 'hardhat/config';
import { Wallet } from 'ethers';

import '@typechain/hardhat';
import 'solidity-coverage';
import '@nomiclabs/hardhat-etherscan';
import 'hardhat-gas-reporter';
import '@tenderly/hardhat-tenderly';
import 'hardhat-deploy';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';

if (process.env.SKIP_LOAD !== 'true') {
  // eslint-disable-next-line global-require
  ['deploy', 'helpers'].forEach((folder) => {
    const tasksPath = path.join(__dirname, 'tasks', folder);
    fs.readdirSync(tasksPath)
      .filter((pth) => pth.includes('.ts'))
      .forEach((task) => {
        require(`${tasksPath}/${task}`);
      });
  });
}

export const BUIDLEREVM_CHAIN_ID = 31337;
const balance = '1000000000000000000000000';
const DEFAULT_BLOCK_GAS_LIMIT = 12500000;
const DEFAULT_GAS_PRICE = Number(process.env.DEFAULT_GAS_PRICE) || 50000000000; // 50 gwei
const HARDFORK = 'istanbul';
const INFURA_KEY = process.env.INFURA_KEY || '';
const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY || '';
const MNEMONIC_PATH = "m/44'/60'/0'/0";
const MNEMONIC = process.env.MNEMONIC || '';
const ALCHEMY_KEY = process.env.ALCHEMY_KEY || '';
const MAINNET_FORK = process.env.MAINNET_FORK === 'true';

const mainnetFork =
  MAINNET_FORK && process.env.FORKING_BLOCK
    ? {
        // eslint-disable-next-line radix
        blockNumber: parseInt(process.env.FORKING_BLOCK),
        url: ALCHEMY_KEY
          ? `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`
          : `https://main.infura.io/v3/${INFURA_KEY}`,
      }
    : undefined;

const getCommonNetworkConfig = (networkName: string, networkId: number) => ({
  url: ALCHEMY_KEY
    ? `https://eth-${
        networkName === 'main' ? 'mainnet' : networkName
      }.alchemyapi.io/v2/${ALCHEMY_KEY}`
    : `https://${networkName}.infura.io/v3/${INFURA_KEY}`,
  hardfork: HARDFORK,
  blockGasLimit: DEFAULT_BLOCK_GAS_LIMIT,
  gasPrice: DEFAULT_GAS_PRICE,
  chainId: networkId,
  accounts: {
    mnemonic: MNEMONIC,
    path: MNEMONIC_PATH,
    initialIndex: 0,
    count: 20,
  },
});

const getLocalAccounts = () => {
  if (process.env.SISMO_SERVER_ENV !== 'local')
    throw new Error('NOT LOCAL SERVER ENV FILE');
  return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0].map((a, k) => {
    return {
      privateKey: Wallet.fromMnemonic(MNEMONIC, `m/44'/60'/0'/0/${k}`)
        .privateKey,
      balance,
    };
  });
};

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.4',
        settings: {
          optimizer: { enabled: true, runs: 200 },
          evmVersion: 'berlin',
        },
      },
      {
        version: '0.5.0',
        settings: {
          optimizer: { enabled: true, runs: 200 },
          evmVersion: 'berlin',
        },
      },
    ],
  },
  typechain: {
    outDir: 'types',
  },
  etherscan: {
    apiKey: ETHERSCAN_KEY,
  },
  defaultNetwork: 'hardhat',
  mocha: {
    timeout: 0,
  },
  networks: {
    kovan: getCommonNetworkConfig('kovan', 42),
    ropsten: getCommonNetworkConfig('ropsten', 3),
    rinkeby: getCommonNetworkConfig('rinkeby', 4),
    main: getCommonNetworkConfig('main', 1),
    local: {
      url: 'http://localhost:8545',
      // eslint-disable-next-line no-shadow
      accounts: {
        mnemonic: MNEMONIC,
        path: MNEMONIC_PATH,
        initialIndex: 0,
        count: 20,
      },
      hardfork: HARDFORK,
      blockGasLimit: DEFAULT_BLOCK_GAS_LIMIT,
      gasPrice: DEFAULT_GAS_PRICE,
      chainId: 31337,
    },
    hardhat: {
      hardfork: 'london',
      blockGasLimit: DEFAULT_BLOCK_GAS_LIMIT,
      gas: DEFAULT_BLOCK_GAS_LIMIT,
      gasPrice: DEFAULT_GAS_PRICE,
      chainId: BUIDLEREVM_CHAIN_ID,
      throwOnTransactionFailures: true,
      throwOnCallFailures: true,
      // eslint-disable-next-line no-shadow
      accounts: getLocalAccounts(),
      forking: mainnetFork,
    },
    ganache: {
      url: 'http://ganache:8545',
      accounts: {
        mnemonic:
          'fox sight canyon orphan hotel grow hedgehog build bless august weather swarm',
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
      },
    },
    coverage: {
      url: 'http://localhost:8555',
    },
  },
};

export default config;
