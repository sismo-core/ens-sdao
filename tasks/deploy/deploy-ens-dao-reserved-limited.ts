import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ethers } from 'ethers';
//@ts-ignore
import nameHash from 'eth-ens-namehash';
import { getDeployer, logHre } from '../helpers';
import {
  ENSDaoRegistrarPresetReservedLimited,
  ENSDaoRegistrarPresetReservedLimited__factory,
  GenToken,
  GenToken__factory,
} from '../../types';

type DeployEnsDaoReservedLimitedArgs = {
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
  // reservation duration of the ENS DAO Registrar
  reservationDuration?: string;
  // limit of registrations
  registrationLimit?: number;
  // enabling logging
  log?: boolean;
};

export type DeployedEnsDaoReservedLimited = {
  ensDaoRegistrar: ENSDaoRegistrarPresetReservedLimited;
  genToken: GenToken;
};

async function deploiementAction(
  {
    ens,
    resolver,
    nameWrapper = ethers.constants.AddressZero,
    name = 'sismo',
    symbol = 'SDAO',
    gens = [0],
    owner: optionalOwner,
    reservationDuration = (4 * 7 * 24 * 3600).toString(),
    registrationLimit = 500,
    log,
  }: DeployEnsDaoReservedLimitedArgs,
  hre: HardhatRuntimeEnvironment
): Promise<DeployedEnsDaoReservedLimited> {
  if (log) await logHre(hre);

  const deployer = await getDeployer(hre, log);

  const owner = optionalOwner || deployer.address;

  const node = nameHash.hash(`${name}.eth`);

  const deployedGenToken = await hre.deployments.deploy('GenToken', {
    from: deployer.address,
    args: ['https://tokens.sismo.io/', gens, owner],
  });
  const deployedRegistrar = await hre.deployments.deploy(
    'ENSDaoRegistrarPresetReservedLimited',
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
        reservationDuration,
        registrationLimit,
      ],
    }
  );

  const ensDaoRegistrar = ENSDaoRegistrarPresetReservedLimited__factory.connect(
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

task('deploy-ens-dao-reserved-limited')
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
