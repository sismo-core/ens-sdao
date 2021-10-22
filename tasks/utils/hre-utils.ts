import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

export const getDeployer = async (
  hre: HardhatRuntimeEnvironment,
  log?: boolean,
  accountNumber = Number(process.env.DEPLOYER_ACCOUNT) || 0
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
