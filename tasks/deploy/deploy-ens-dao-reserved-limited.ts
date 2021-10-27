import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ethers } from 'ethers';
//@ts-ignore
import nameHash from 'eth-ens-namehash';
import { getDeployer, logHre } from '../utils';
import {
  ENSDaoRegistrarPresetReservedLimited,
  ENSDaoRegistrarPresetReservedLimited__factory,
  ENSDaoToken,
  ENSDaoToken__factory,
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
  ensDaoToken: ENSDaoToken;
};

async function deploiementAction(
  {
    ens,
    resolver,
    nameWrapper = ethers.constants.AddressZero,
    name = 'sismo',
    symbol = 'SDAO',
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

  const deployedDaoToken = await hre.deployments.deploy('ENSDaoToken', {
    from: deployer.address,
    args: [`${name}.eth DAO`, symbol, 'https://tokens.sismo.io/', owner],
  });
  const deployedRegistrar = await hre.deployments.deploy(
    'ENSDaoRegistrarPresetReservedLimited',
    {
      from: deployer.address,
      args: [
        ens,
        resolver,
        nameWrapper,
        deployedDaoToken.address,
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
  const ensDaoToken = ENSDaoToken__factory.connect(
    deployedDaoToken.address,
    deployer
  );

  // Allow the ENS DAO Token to be minted by the deployed ENS DAO Registrar
  await (await ensDaoToken.setMinter(ensDaoRegistrar.address)).wait();

  if (log) {
    console.log(`Deployed ENS DAO Token: ${deployedDaoToken.address}`);
    console.log(`Deployed ENS DAO Registrar: ${deployedRegistrar.address}`);
  }

  return {
    ensDaoRegistrar,
    ensDaoToken,
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
