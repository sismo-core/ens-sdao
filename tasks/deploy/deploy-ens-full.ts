import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { getDeployer, logHre } from '../helpers';
import {
  ENSDeployer__factory,
  ENSRegistry__factory,
  EthRegistrar__factory,
  ReverseRegistrar__factory,
  PublicResolver__factory,
  NameWrapper__factory,
  ENSDeployer,
  ENSRegistry,
  EthRegistrar,
  ReverseRegistrar,
  PublicResolver,
  NameWrapper,
} from '../../types';
import { DeployedEnsDao } from './deploy-ens-dao';

type DeployEnsFullArgs = {
  // additionally deploy ENS DAO contracts
  ensDao?: boolean;
  // enabling logging
  log?: boolean;
};

export type DeployedEns = {
  ensDeployer: ENSDeployer;
  registry: ENSRegistry;
  registrar: EthRegistrar;
  reverseRegistrar: ReverseRegistrar;
  publicResolver: PublicResolver;
  nameWrapper: NameWrapper;
};

export type DeployedFullSuite = DeployedEns | (DeployedEns & DeployedEnsDao);

async function deploiementAction(
  { ensDao, log }: DeployEnsFullArgs,
  hre: HardhatRuntimeEnvironment
): Promise<DeployedFullSuite> {
  if (log) await logHre(hre);

  const deployer = await getDeployer(hre, log);

  const newEnsDeployer = await hre.deployments.deploy('ENSDeployer', {
    from: deployer.address,
    args: [],
  });

  const ensDeployer = ENSDeployer__factory.connect(
    newEnsDeployer.address,
    deployer
  );
  const registry = ENSRegistry__factory.connect(
    await ensDeployer.ens(),
    deployer
  );
  const registrar = EthRegistrar__factory.connect(
    await ensDeployer.ethRegistrar(),
    deployer
  );
  const reverseRegistrar = ReverseRegistrar__factory.connect(
    await ensDeployer.reverseRegistrar(),
    deployer
  );
  const publicResolver = PublicResolver__factory.connect(
    await ensDeployer.publicResolver(),
    deployer
  );
  const nameWrapper = NameWrapper__factory.connect(
    await ensDeployer.nameWrapper(),
    deployer
  );

  console.log(
    `Deployed by ${deployer.address}.
      ensDeployer: ${ensDeployer.address}
      registry: ${registry.address}
      registrar: ${registrar.address}
      reverseRegistrar: ${reverseRegistrar.address}
      publicResolver: ${publicResolver.address}
      nameWrapper: ${nameWrapper.address}
      `
  );

  if (!ensDao)
    return {
      ensDeployer,
      registry,
      registrar,
      reverseRegistrar,
      publicResolver,
      nameWrapper,
    };

  const { ensDaoRegistrar, ensDaoToken }: DeployedEnsDao = await hre.run(
    'deploy-ens-dao',
    {
      name: 'sismo',
      symbol: 'SISMO',
      ens: registry.address,
      resolver: publicResolver.address,
      nameWrapper: nameWrapper.address,
      log,
    }
  );

  return {
    ensDeployer,
    registry,
    registrar,
    reverseRegistrar,
    publicResolver,
    nameWrapper,
    ensDaoRegistrar,
    ensDaoToken,
  };
}

task('deploy-ens-full')
  .addFlag('ensDao', 'deploy ens-dao')
  .addFlag('log', 'logging deployments')
  .setAction(deploiementAction);
