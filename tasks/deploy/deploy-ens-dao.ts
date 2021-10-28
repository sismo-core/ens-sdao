import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
//@ts-ignore
import nameHash from 'eth-ens-namehash';
import { getDeployer, logHre } from '../utils';
import { ENSDaoRegistrar, ENSDaoRegistrar__factory } from '../../types';

type DeployEnsDaoArgs = {
  // ENS Registry address
  ens: string;
  // Public Resolver address
  resolver: string;
  // name of the .eth domain, the NFT name will be `${name}.eth DAO`
  name: string;
  // owner address of the contracts
  owner?: string;
  // enabling logging
  log?: boolean;
};

export type DeployedEnsDao = {
  ensDaoRegistrar: ENSDaoRegistrar;
};

async function deploiementAction(
  {
    ens,
    resolver,
    name = 'sismo',
    owner: optionalOwner,
    log,
  }: DeployEnsDaoArgs,
  hre: HardhatRuntimeEnvironment
): Promise<DeployedEnsDao> {
  if (log) await logHre(hre);

  const deployer = await getDeployer(hre, log);

  const owner = optionalOwner || deployer.address;

  const node = nameHash.hash(`${name}.eth`);

  const deployedRegistrar = await hre.deployments.deploy('ENSDaoRegistrar', {
    from: deployer.address,
    args: [ens, resolver, node, name, owner],
  });

  const ensDaoRegistrar = ENSDaoRegistrar__factory.connect(
    deployedRegistrar.address,
    deployer
  );

  if (log) {
    console.log(`Deployed ENS DAO Registrar: ${deployedRegistrar.address}`);
  }

  return { ensDaoRegistrar };
}

task('deploy-ens-dao')
  .addOptionalParam('ens', 'ens')
  .addOptionalParam('resolver', 'resolver')
  .addOptionalParam('baseURI', 'baseURI')
  .addOptionalParam('name', 'name')
  .addOptionalParam('owner', 'owner')
  .addOptionalParam('reservationDuration', 'reservationDuration')
  .addFlag('log', 'log')
  .addFlag('verify', 'Verify Etherscan Contract')
  .setAction(deploiementAction);
