import HRE from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

export async function increaseTime(
  hre: HardhatRuntimeEnvironment,
  secondsToIncrease: number
): Promise<void> {
  await hre.ethers.provider.send('evm_increaseTime', [secondsToIncrease]);
  await hre.ethers.provider.send('evm_mine', []);
}

export async function evmSnapshot(): Promise<void> {
  await HRE.ethers.provider.send('evm_snapshot', []);
}

export async function evmRevert(id: string): Promise<void> {
  await HRE.ethers.provider.send('evm_revert', [id]);
}
