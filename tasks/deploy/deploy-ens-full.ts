import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { getDeployer, logHre } from '../utils';
import {
  ENSDeployer__factory,
  ENSRegistry__factory,
  EthRegistrar__factory,
  ReverseRegistrar__factory,
  PublicResolver__factory,
  ENSDeployer,
  ENSRegistry,
  EthRegistrar,
  ReverseRegistrar,
  PublicResolver,
} from '../../types';
import { DeployedSDao } from './sdao/deploy-sdao';

type DeployEnsFullArgs = {
  // additionally deploy SDAO contracts
  sDao?: boolean;
  // Name of the deployment
  deploymentName: string;
  // enabling logging
  log?: boolean;
};

export type DeployedEns = {
  ensDeployer: ENSDeployer;
  registry: ENSRegistry;
  registrar: EthRegistrar;
  reverseRegistrar: ReverseRegistrar;
  publicResolver: PublicResolver;
};

export type DeployedFullSuite = DeployedEns | (DeployedEns & DeployedSDao);

async function deploiementAction(
  { sDao, deploymentName, log }: DeployEnsFullArgs,
  hre: HardhatRuntimeEnvironment
): Promise<DeployedFullSuite> {
  if (log) await logHre(hre);

  const deployer = await getDeployer(hre, log);

  const newEnsDeployer = await hre.deployments.deploy(deploymentName, {
    contract: 'ENSDeployer',
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

  console.log(
    `Deployed by ${deployer.address}.
      ensDeployer: ${ensDeployer.address}
      registry: ${registry.address}
      registrar: ${registrar.address}
      reverseRegistrar: ${reverseRegistrar.address}
      publicResolver: ${publicResolver.address}
      `
  );

  if (!sDao)
    return {
      ensDeployer,
      registry,
      registrar,
      reverseRegistrar,
      publicResolver,
    };

  const { sDaoRegistrar }: DeployedSDao = await hre.run('deploy-sdao', {
    name: 'sismo',
    ens: registry.address,
    resolver: publicResolver.address,
    log,
  });

  return {
    ensDeployer,
    registry,
    registrar,
    reverseRegistrar,
    publicResolver,
    sDaoRegistrar,
  };
}

task('deploy-ens-full')
  .addFlag('sDao', 'deploy subdomain-dao')
  .addFlag('log', 'logging deployments')
  .setAction(deploiementAction);
