import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { ethers } from 'hardhat';

const accountNumber = Number(process.env.DEPLOYER_ACCOUNT) || 0;

export const increaseTime = async (
  hre: HardhatRuntimeEnvironment,
  secondsToIncrease: number
): Promise<void> => {
  await hre.ethers.provider.send('evm_increaseTime', [secondsToIncrease]);
  await hre.ethers.provider.send('evm_mine', []);
};

export const getDeployer = async (
  hre: HardhatRuntimeEnvironment,
  log?: boolean
): Promise<SignerWithAddress> => {
  const deployer = (await hre.ethers.getSigners())[accountNumber];
  if (log) {
    console.log(`
  *** Deployer ***********************
    using deployer: ${deployer.address}
    balance: ${await deployer.getBalance()}
  ************************************
    `);
  }
  return deployer;
};

export const logHre = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  console.log(`
  *** HRE LOGS ***********************
    chainId: ${await hre.getChainId()} 
  ************************************
  `);
};
