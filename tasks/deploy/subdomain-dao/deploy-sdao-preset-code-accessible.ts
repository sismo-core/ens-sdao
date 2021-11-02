import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
//@ts-ignore
import nameHash from 'eth-ens-namehash';
import { getDeployer, logHre } from '../../utils';
import {
  SDaoRegistrarPresetCodeAccessible__factory,
  SDaoRegistrarPresetCodeAccessible,
} from '../../../types';

type DeploySDaoPresetCodeAccessibleArgs = {
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
  // Address of the code signer
  codeSigner?: string;
  // Initial group ID
  initialGroupId: number;
  // Enabling logging
  log?: boolean;
};

export type DeployedSDaoPresetCodeAccessible = {
  sDaoRegistrar: SDaoRegistrarPresetCodeAccessible;
};

async function deploiementAction(
  {
    ens,
    resolver,
    name = 'sismo',
    owner: optionalOwner,
    domainName = 'Sismo App',
    domainVersion = '1.0',
    codeSigner: optionalCodeSigner,
    initialGroupId,
    log,
  }: DeploySDaoPresetCodeAccessibleArgs,
  hre: HardhatRuntimeEnvironment
): Promise<DeployedSDaoPresetCodeAccessible> {
  if (log) await logHre(hre);

  const deployer = await getDeployer(hre, log);

  const owner = optionalOwner || deployer.address;
  const codeSigner = optionalCodeSigner || deployer.address;

  const node = nameHash.hash(`${name}.eth`);

  const deployedRegistrar = await hre.deployments.deploy(
    'SDaoRegistrarPresetCodeAccessible',
    {
      from: deployer.address,
      args: [
        ens,
        resolver,
        node,
        owner,
        domainName,
        domainVersion,
        codeSigner,
        initialGroupId,
      ],
    }
  );

  const sDaoRegistrar = SDaoRegistrarPresetCodeAccessible__factory.connect(
    deployedRegistrar.address,
    deployer
  );

  if (log) {
    console.log(
      `Deployed SDAO Registrar Preset Code Accessible: ${deployedRegistrar.address}`
    );
  }

  return {
    sDaoRegistrar,
  };
}

task('deploy-sdao-preset-code-accessible')
  .addOptionalParam('ens', 'ens')
  .addOptionalParam('resolver', 'resolver')
  .addOptionalParam('baseURI', 'baseURI')
  .addOptionalParam('name', 'name')
  .addOptionalParam('owner', 'owner')
  .addFlag('log', 'log')
  .addFlag('verify', 'Verify Etherscan Contract')
  .setAction(deploiementAction);
