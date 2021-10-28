import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ethers } from 'ethers';
//@ts-ignore
import nameHash from 'eth-ens-namehash';
import { getDeployer, logHre } from '../helpers';
import {
  ENSDaoRegistrarPresetClaimable,
  ENSDaoRegistrarPresetClaimable__factory,
  GenToken,
  GenToken__factory,
  ENSLabelBooker,
} from '../../types';
import { DeployedLabelBooker } from '.';

type DeployEnsDaoClaimableArgs = {
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

export type DeployedEnsDaoClaimable = {
  ensDaoRegistrar: ENSDaoRegistrarPresetClaimable;
  ensLabelBooker: ENSLabelBooker;
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

  const deployedGenToken = await hre.deployments.deploy('GenToken', {
    from: deployer.address,
    args: ['https://tokens.sismo.io/', gens, owner],
  });
  const deployedRegistrar = await hre.deployments.deploy(
    'ENSDaoRegistrarPresetClaimable',
    {
      from: deployer.address,
      args: [
        ens,
        resolver,
        nameWrapper,
        deployedGenToken.address,
        node,
        name,
        owner,
        ensLabelBooker.address,
      ],
    }
  );

  const ensDaoRegistrar = ENSDaoRegistrarPresetClaimable__factory.connect(
    deployedRegistrar.address,
    deployer
  );
  const genToken = GenToken__factory.connect(
    deployedGenToken.address,
    deployer
  );

  // Allow the ENS DAO Token to be minted by the deployed ENS DAO Registrar
  await (await genToken.setMinter(ensDaoRegistrar.address)).wait();
  // Set the registrar for the ENS Label Booker
  await (await ensLabelBooker.setRegistrar(ensDaoRegistrar.address)).wait();

  if (log) {
    console.log(`Deployed Gen Token: ${deployedGenToken.address}`);
    console.log(`Deployed ENS DAO Registrar: ${deployedRegistrar.address}`);
  }

  return {
    ensDaoRegistrar,
    genToken,
    ensLabelBooker,
  };
}

task('deploy-ens-dao-claimable')
  .addOptionalParam('ens', 'ens')
  .addOptionalParam('resolver', 'resolver')
  .addOptionalParam('nameWrapper', 'nameWrapper')
  .addOptionalParam('baseURI', 'baseURI')
  .addOptionalParam('name', 'name')
  .addOptionalParam('symbol', 'symbol')
  .addOptionalParam('owner', 'owner')
  .addFlag('log', 'log')
  .addFlag('verify', 'Verify Etherscan Contract')
  .setAction(deploiementAction);
