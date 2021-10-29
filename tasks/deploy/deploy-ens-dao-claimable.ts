import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
//@ts-ignore
import nameHash from 'eth-ens-namehash';
import { getDeployer, logHre } from '../utils';
import {
  ENSDaoRegistrarPresetClaimable,
  ENSDaoRegistrarPresetClaimable__factory,
  ENSLabelBooker,
} from '../../types';
import { DeployedLabelBooker } from '.';

type DeployEnsDaoClaimableArgs = {
  // ENS Registry address
  ens: string;
  // Public Resolver address
  resolver: string;
  // name of the .eth domain
  name: string;
  // owner address of the contracts
  owner?: string;
  // enabling logging
  log?: boolean;
};

export type DeployedEnsDaoClaimable = {
  ensDaoRegistrar: ENSDaoRegistrarPresetClaimable;
  ensLabelBooker: ENSLabelBooker;
};

async function deploiementAction(
  {
    ens,
    resolver,
    name = 'sismo',
    owner: optionalOwner,
    log,
  }: DeployEnsDaoClaimableArgs,
  hre: HardhatRuntimeEnvironment
): Promise<DeployedEnsDaoClaimable> {
  if (log) await logHre(hre);

  const deployer = await getDeployer(hre, log);

  const owner = optionalOwner || deployer.address;

  const node = nameHash.hash(`${name}.eth`);

  const { ensLabelBooker }: DeployedLabelBooker = await hre.run(
    'deploy-label-booker',
    {
      ens,
      name,
      owner,
      log,
    }
  );
  const deployedRegistrar = await hre.deployments.deploy(
    'ENSDaoRegistrarPresetClaimable',
    {
      from: deployer.address,
      args: [ens, resolver, node, owner, ensLabelBooker.address],
    }
  );

  const ensDaoRegistrar = ENSDaoRegistrarPresetClaimable__factory.connect(
    deployedRegistrar.address,
    deployer
  );

  // Set the registrar for the ENS Label Booker
  await (await ensLabelBooker.setRegistrar(ensDaoRegistrar.address)).wait();

  if (log) {
    console.log(`Deployed ENS DAO Registrar: ${deployedRegistrar.address}`);
  }

  return {
    ensDaoRegistrar,
    ensLabelBooker,
  };
}

task('deploy-ens-dao-claimable')
  .addOptionalParam('ens', 'ens')
  .addOptionalParam('resolver', 'resolver')
  .addOptionalParam('baseURI', 'baseURI')
  .addOptionalParam('name', 'name')
  .addOptionalParam('owner', 'owner')
  .addFlag('log', 'log')
  .addFlag('verify', 'Verify Etherscan Contract')
  .setAction(deploiementAction);
