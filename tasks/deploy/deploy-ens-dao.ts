import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ethers } from 'ethers';
//@ts-ignore
import nameHash from 'eth-ens-namehash';
import { getDeployer, logHre } from '../utils';
import {
  ENSDaoRegistrar,
  ENSDaoRegistrar__factory,
  ENSDaoToken,
  ENSDaoToken__factory,
  TicketManager,
  TicketManager__factory,
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
  // owner address of the contracts
  owner?: string;
  // reservation duration of the ENS DAO Registrar
  reservationDuration?: string;
  // maximum daily consumption of ticket
  maxDailyTicketConsumption?: number;
  // enabling logging
  log?: boolean;
};

export type DeployedEnsDao = {
  ensDaoRegistrar: ENSDaoRegistrar;
  ensDaoToken: ENSDaoToken;
  ticketManager: TicketManager;
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
    maxDailyTicketConsumption = 30,
    log,
  }: DeployEnsDaoArgs,
  hre: HardhatRuntimeEnvironment
): Promise<DeployedEnsDao> {
  if (log) await logHre(hre);

  const deployer = await getDeployer(hre, log);

  const owner = optionalOwner || deployer.address;

  const node = nameHash.hash(`${name}.eth`);

  const deployedDaoToken = await hre.deployments.deploy('ENSDaoToken', {
    from: deployer.address,
    args: [`${name}.eth DAO`, symbol, 'https://tokens.sismo.io/', owner],
  });
  const deployedTicketManager = await hre.deployments.deploy('TicketManager', {
    from: deployer.address,
    args: [maxDailyTicketConsumption, owner],
  });
  const deployedRegistrar = await hre.deployments.deploy('ENSDaoRegistrar', {
    from: deployer.address,
    args: [
      ens,
      resolver,
      nameWrapper,
      deployedDaoToken.address,
      deployedTicketManager.address,
      node,
      name,
      owner,
      reservationDuration,
    ],
  });

  const ensDaoRegistrar = ENSDaoRegistrar__factory.connect(
    deployedRegistrar.address,
    deployer
  );
  const ticketManager = TicketManager__factory.connect(
    deployedTicketManager.address,
    deployer
  );
  const ensDaoToken = ENSDaoToken__factory.connect(
    deployedDaoToken.address,
    deployer
  );

  // Allow the ENS DAO Registrar as auxiliary of the Ticket Manager
  await (await ticketManager.setAuxiliary(ensDaoRegistrar.address)).wait();

  // Allow the ENS DAO Token to be minted by the deployed ENS DAO Registrar
  await (await ensDaoToken.setMinter(ensDaoRegistrar.address)).wait();

  if (log) {
    console.log(`Deployed ENS DAO Token: ${deployedDaoToken.address}`);
    console.log(`Deployed ENS DAO Registrar: ${deployedRegistrar.address}`);
    console.log(`Deployed Ticket Manager: ${ticketManager.address}`);
  }

  return {
    ensDaoRegistrar,
    ensDaoToken,
    ticketManager,
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
