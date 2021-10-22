import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { getDeployer, logHre } from '../utils/hre-utils';

task('log-env').setAction(async ({}, hre: HardhatRuntimeEnvironment) => {
  await logHre(hre);
  await getDeployer(hre, true);
});
