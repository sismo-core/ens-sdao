import { HardhatRuntimeEnvironment } from 'hardhat/types';

export async function increaseTime(
  hre: HardhatRuntimeEnvironment,
  secondsToIncrease: number
): Promise<void> {
  await hre.ethers.provider.send('evm_increaseTime', [secondsToIncrease]);
  await hre.ethers.provider.send('evm_mine', []);
}

export async function evmSnapshot(
  hre: HardhatRuntimeEnvironment
): Promise<string> {
  const snapshotId = hre.ethers.provider.send('evm_snapshot', []);
  return snapshotId;
}

export async function evmRevert(
  hre: HardhatRuntimeEnvironment,
  snapshotId: string
): Promise<void> {
  await hre.ethers.provider.send('evm_revert', [snapshotId]);
}
