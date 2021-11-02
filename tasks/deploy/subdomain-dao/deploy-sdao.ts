import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
//@ts-ignore
import nameHash from 'eth-ens-namehash';
import { getDeployer, logHre } from '../../utils';
import { SDaoRegistrar, SDaoRegistrar__factory } from '../../../types';

type DeploySDaoArgs = {
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

export type DeployedSDao = {
  sDaoRegistrar: SDaoRegistrar;
};

async function deploiementAction(
  { ens, resolver, name = 'sismo', owner: optionalOwner, log }: DeploySDaoArgs,
  hre: HardhatRuntimeEnvironment
): Promise<DeployedSDao> {
  if (log) await logHre(hre);

  const deployer = await getDeployer(hre, log);

  const owner = optionalOwner || deployer.address;

  const node = nameHash.hash(`${name}.eth`);

  const deployedRegistrar = await hre.deployments.deploy('SDaoRegistrar', {
    from: deployer.address,
    args: [ens, resolver, node, owner],
  });

  const sDaoRegistrar = SDaoRegistrar__factory.connect(
    deployedRegistrar.address,
    deployer
  );

  if (log) {
    console.log(`Deployed SDAO Registrar: ${deployedRegistrar.address}`);
  }

  return { sDaoRegistrar };
}

task('deploy-sdao')
  .addOptionalParam('ens', 'ens')
  .addOptionalParam('resolver', 'resolver')
  .addOptionalParam('baseURI', 'baseURI')
  .addOptionalParam('name', 'name')
  .addOptionalParam('owner', 'owner')
  .addOptionalParam('reservationDuration', 'reservationDuration')
  .addFlag('log', 'log')
  .addFlag('verify', 'Verify Etherscan Contract')
  .setAction(deploiementAction);
