import { HardhatRuntimeEnvironment } from 'hardhat/types';

export const increaseTime = async (
  hre: HardhatRuntimeEnvironment,
  secondsToIncrease: number
): Promise<void> => {
  await hre.ethers.provider.send('evm_increaseTime', [secondsToIncrease]);
  await hre.ethers.provider.send('evm_mine', []);
};
