import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
//@ts-ignore
import nameHash from 'eth-ens-namehash';
import { getDeployer, logHre } from '../utils';
import { ENSLabelBooker, ENSLabelBooker__factory } from '../../types';

type DeployLabelBooker = {
  // ENS Registry address
  ens: string;
  // name of the .eth domain
  name: string;
  // owner address of the contracts
  owner?: string;
  // enabling logging
  log?: boolean;
};

export type DeployedLabelBooker = {
  ensLabelBooker: ENSLabelBooker;
};

async function deploiementAction(
  { ens, name = 'sismo', owner: optionalOwner, log }: DeployLabelBooker,
  hre: HardhatRuntimeEnvironment
): Promise<DeployedLabelBooker> {
  if (log) await logHre(hre);

  const deployer = await getDeployer(hre, log);

  const owner = optionalOwner || deployer.address;

  const node = nameHash.hash(`${name}.eth`);

  const deployedLabelBooker = await hre.deployments.deploy('ENSLabelBooker', {
    from: deployer.address,
    args: [ens, node, owner],
  });

  const ensLabelBooker = ENSLabelBooker__factory.connect(
    deployedLabelBooker.address,
    deployer
  );

  if (log) {
    console.log(`Deployed ENS Label Booker: ${deployedLabelBooker.address}`);
  }

  return {
    ensLabelBooker,
  };
}

task('deploy-label-booker')
  .addOptionalParam('ens', 'ens')
  .addOptionalParam('name', 'name')
  .addOptionalParam('owner', 'owner')
  .addFlag('log', 'log')
  .addFlag('verify', 'Verify Etherscan Contract')
  .setAction(deploiementAction);
