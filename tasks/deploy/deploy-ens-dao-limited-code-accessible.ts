import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
//@ts-ignore
import nameHash from 'eth-ens-namehash';
import { getDeployer, logHre } from '../utils';
import {
  ENSDaoRegistrarPresetLimitedCodeAccessible__factory,
  ENSDaoRegistrarPresetLimitedCodeAccessible,
} from '../../types';

type DeployEnsDaoLimitedCodeAccessibleArgs = {
  // ENS Registry address
  ens: string;
  // Public Resolver address
  resolver: string;
  // name of the .eth domain
  name: string;
  // owner address of the contracts
  owner?: string;
  // Limit of registrations
  registrationLimit?: number;
  // Name field of the EIP712 Domain
  domainName?: string;
  // Version field of the EIP712 Domain
  domainVersion?: string;
  // Initial group ID
  initialGroupId: number;
  // Enabling logging
  log?: boolean;
};

export type DeployedEnsDaoLimitedCodeAccessible = {
  ensDaoRegistrar: ENSDaoRegistrarPresetLimitedCodeAccessible;
};

async function deploiementAction(
  {
    ens,
    resolver,
    name = 'sismo',
    owner: optionalOwner,
    registrationLimit = 500,
    domainName = 'Sismo App',
    domainVersion = '1.0',
    initialGroupId,
    log,
  }: DeployEnsDaoLimitedCodeAccessibleArgs,
  hre: HardhatRuntimeEnvironment
): Promise<DeployedEnsDaoLimitedCodeAccessible> {
  if (log) await logHre(hre);

  const deployer = await getDeployer(hre, log);

  const owner = optionalOwner || deployer.address;

  const node = nameHash.hash(`${name}.eth`);

  const deployedRegistrar = await hre.deployments.deploy(
    'ENSDaoRegistrarPresetLimitedCodeAccessible',
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
        registrationLimit,
        initialGroupId,
      ],
    }
  );

  const ensDaoRegistrar =
    ENSDaoRegistrarPresetLimitedCodeAccessible__factory.connect(
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

task('deploy-ens-dao-limited-code-accessible')
  .addOptionalParam('ens', 'ens')
  .addOptionalParam('resolver', 'resolver')
  .addOptionalParam('baseURI', 'baseURI')
  .addOptionalParam('name', 'name')
  .addOptionalParam('owner', 'owner')
  .addFlag('log', 'log')
  .addFlag('verify', 'Verify Etherscan Contract')
  .setAction(deploiementAction);
