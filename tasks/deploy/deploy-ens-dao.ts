import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ethers } from 'ethers';
//@ts-ignore
import nameHash from 'eth-ens-namehash';
import { getDeployer, logHre } from '../helpers';
import {
  ENSDaoRegistrar,
  ENSDaoRegistrar__factory,
  GenToken,
  GenToken__factory,
} from '../../types';

type DeployEnsDaoArgs = {
  // ENS Registry address
  ens: string;
  // Public Resolver address
  resolver: string;
  // Name Wrapper address, default to zero address
  nameWrapper?: string;
  // name of the .eth domain, the NFT name will be `${name}.eth DAO`
  name: string;
  // symbol of the DAO Token
  symbol: string;
  // generation IDs
  gens?: number[];
  // owner address of the contracts
  owner?: string;
  // enabling logging
  log?: boolean;
};

export type DeployedEnsDao = {
  ensDaoRegistrar: ENSDaoRegistrar;
  genToken: GenToken;
};

async function deploiementAction(
  {
    ens,
    resolver,
    nameWrapper = ethers.constants.AddressZero,
    name = 'sismo',
    gens = [0],
    owner: optionalOwner,
    log,
  }: DeployEnsDaoArgs,
  hre: HardhatRuntimeEnvironment
): Promise<DeployedEnsDao> {
  if (log) await logHre(hre);

  const deployer = await getDeployer(hre, log);

  const owner = optionalOwner || deployer.address;

  const node = nameHash.hash(`${name}.eth`);

  const deployedGenToken = await hre.deployments.deploy('GenToken', {
    from: deployer.address,
    args: ['https://tokens.sismo.io/', gens, owner],
  });
  const deployedRegistrar = await hre.deployments.deploy('ENSDaoRegistrar', {
    from: deployer.address,
    args: [
      ens,
      resolver,
      nameWrapper,
      deployedGenToken.address,
      node,
      name,
      owner,
    ],
  });

  const ensDaoRegistrar = ENSDaoRegistrar__factory.connect(
    deployedRegistrar.address,
    deployer
  );
  const genToken = GenToken__factory.connect(
    deployedGenToken.address,
    deployer
  );

  // Allow the ENS DAO Token to be minted by the deployed ENS DAO Registrar
  await (await genToken.setMinter(ensDaoRegistrar.address)).wait();

  if (log) {
    console.log(`Deployed Gen Token: ${deployedGenToken.address}`);
    console.log(`Deployed ENS DAO Registrar: ${deployedRegistrar.address}`);
  }

  return {
    ensDaoRegistrar,
    genToken,
  };
}

task('deploy-ens-dao')
  .addOptionalParam('ens', 'ens')
  .addOptionalParam('resolver', 'resolver')
  .addOptionalParam('nameWrapper', 'nameWrapper')
  .addOptionalParam('baseURI', 'baseURI')
  .addOptionalParam('name', 'name')
  .addOptionalParam('symbol', 'symbol')
  .addOptionalParam('owner', 'owner')
  .addOptionalParam('reservationDuration', 'reservationDuration')
  .addFlag('log', 'log')
  .addFlag('verify', 'Verify Etherscan Contract')
  .setAction(deploiementAction);
