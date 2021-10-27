import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ethers } from 'ethers';
//@ts-ignore
import nameHash from 'eth-ens-namehash';
import { getDeployer, logHre } from '../utils';
import {
  ENSDaoRegistrarPresetLimitedTicketable__factory,
  ENSDaoRegistrarPresetLimitedTicketable,
  ENSDaoToken,
  ENSDaoToken__factory,
} from '../../types';

type DeployEnsDaoLimitedTicketableArgs = {
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

export type DeployedEnsDaoLimitedTicketable = {
  ensDaoRegistrar: ENSDaoRegistrarPresetLimitedTicketable;
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
    registrationLimit = 500,
    domainName = 'Sismo App',
    domainVersion = '1.0',
    initialGroupId,
    log,
  }: DeployEnsDaoLimitedTicketableArgs,
  hre: HardhatRuntimeEnvironment
): Promise<DeployedEnsDaoLimitedTicketable> {
  if (log) await logHre(hre);

  const deployer = await getDeployer(hre, log);

  const owner = optionalOwner || deployer.address;

  const node = nameHash.hash(`${name}.eth`);

  const deployedDaoToken = await hre.deployments.deploy('ENSDaoToken', {
    from: deployer.address,
    args: [`${name}.eth DAO`, symbol, 'https://tokens.sismo.io/', owner],
  });
  const deployedRegistrar = await hre.deployments.deploy(
    'ENSDaoRegistrarPresetLimitedTicketable',
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
        domainName,
        domainVersion,
        registrationLimit,
        initialGroupId,
      ],
    }
  );

  const ensDaoRegistrar =
    ENSDaoRegistrarPresetLimitedTicketable__factory.connect(
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

task('deploy-ens-dao-limited-ticketable')
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
