import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
//@ts-ignore
import nameHash from 'eth-ens-namehash';
import { getDeployer, logHre } from '../utils';
import {
  ENSDaoRegistrarPresetCodeAccessible__factory,
  ENSDaoRegistrarPresetCodeAccessible,
} from '../../types';

type DeployEnsDaoCodeAccessibleArgs = {
  // ENS Registry address
  ens: string;
  // Public Resolver address
  resolver: string;
  // name of the .eth domain
  name: string;
  // owner address of the contracts
  owner?: string;
  // Name field of the EIP712 Domain
  domainName?: string;
  // Version field of the EIP712 Domain
  domainVersion?: string;
  // Initial group ID
  initialGroupId: number;
  // Enabling logging
  log?: boolean;
};

export type DeployedEnsDaoCodeAccessible = {
  ensDaoRegistrar: ENSDaoRegistrarPresetCodeAccessible;
};

async function deploiementAction(
  {
    ens,
    resolver,
    name = 'sismo',
    owner: optionalOwner,
    domainName = 'Sismo App',
    domainVersion = '1.0',
    initialGroupId,
    log,
  }: DeployEnsDaoCodeAccessibleArgs,
  hre: HardhatRuntimeEnvironment
): Promise<DeployedEnsDaoCodeAccessible> {
  if (log) await logHre(hre);

  const deployer = await getDeployer(hre, log);

  const owner = optionalOwner || deployer.address;

  const node = nameHash.hash(`${name}.eth`);

  const deployedRegistrar = await hre.deployments.deploy(
    'ENSDaoRegistrarPresetCodeAccessible',
    {
      from: deployer.address,
      args: [
        ens,
        resolver,
        node,
        name,
        owner,
        domainName,
        domainVersion,
        initialGroupId,
      ],
    }
  );

  const ensDaoRegistrar = ENSDaoRegistrarPresetCodeAccessible__factory.connect(
    deployedRegistrar.address,
    deployer
  );

  if (log) {
    console.log(`Deployed ENS DAO Registrar: ${deployedRegistrar.address}`);
  }

  return {
    ensDaoRegistrar,
  };
}

task('deploy-ens-dao-preset-code-accessible')
  .addOptionalParam('ens', 'ens')
  .addOptionalParam('resolver', 'resolver')
  .addOptionalParam('baseURI', 'baseURI')
  .addOptionalParam('name', 'name')
  .addOptionalParam('owner', 'owner')
  .addFlag('log', 'log')
  .addFlag('verify', 'Verify Etherscan Contract')
  .setAction(deploiementAction);
