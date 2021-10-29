import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
//@ts-ignore
import nameHash from 'eth-ens-namehash';
import { getDeployer, logHre } from '../utils';
import {
  ENSDaoRegistrarPresetERC1155,
  ENSDaoRegistrarPresetERC1155__factory,
  ERC1155Minter,
  ERC1155Minter__factory,
} from '../../types';

type DeployEnsDaoERC1155Args = {
  // ENS Registry address
  ens: string;
  // Public Resolver address
  resolver: string;
  // name of the .eth domain, the NFT name will be `${name}.eth DAO`
  name: string;
  // reservation duration of the ENS DAO Registrar
  reservationDuration?: string;
  // limit of registrations
  registrationLimit?: number;
  // owner address of the contracts
  owner?: string;
  // enabling logging
  log?: boolean;
};

export type DeployedEnsDaoPresetERC1155 = {
  ensDaoRegistrar: ENSDaoRegistrarPresetERC1155;
  erc1155Token: ERC1155Minter;
};

async function deploiementAction(
  {
    ens,
    resolver,
    name = 'sismo',
    reservationDuration = (4 * 7 * 24 * 3600).toString(),
    registrationLimit = 500,
    owner: optionalOwner,
    log,
  }: DeployEnsDaoERC1155Args,
  hre: HardhatRuntimeEnvironment
): Promise<DeployedEnsDaoPresetERC1155> {
  if (log) await logHre(hre);

  const deployer = await getDeployer(hre, log);

  const owner = optionalOwner || deployer.address;

  const node = nameHash.hash(`${name}.eth`);

  const deployedToken = await hre.deployments.deploy('ERC1155Minter', {
    from: deployer.address,
    args: ['https://tokens.sismo.io/', owner],
  });
  const deployedRegistrar = await hre.deployments.deploy(
    'ENSDaoRegistrarPresetERC1155',
    {
      from: deployer.address,
      args: [
        ens,
        resolver,
        deployedToken.address,
        node,
        owner,
        reservationDuration,
        registrationLimit,
      ],
    }
  );

  const ensDaoRegistrar = ENSDaoRegistrarPresetERC1155__factory.connect(
    deployedRegistrar.address,
    deployer
  );
  const erc1155Token = ERC1155Minter__factory.connect(
    deployedToken.address,
    deployer
  );

  // Allow the ERC1155 Token to be minted by the deployed ENS DAO Registrar
  const MINTER_ROLE = hre.ethers.utils.solidityKeccak256(
    ['string'],
    ['MINTER_ROLE']
  );
  await (
    await erc1155Token.grantRole(MINTER_ROLE, ensDaoRegistrar.address)
  ).wait();

  if (log) {
    console.log(`Deployed ERC1155 Token: ${erc1155Token.address}`);
    console.log(`Deployed ENS DAO Registrar: ${deployedRegistrar.address}`);
  }

  return {
    ensDaoRegistrar,
    erc1155Token,
  };
}

task('deploy-ens-dao-preset-erc1155')
  .addOptionalParam('ens', 'ens')
  .addOptionalParam('resolver', 'resolver')
  .addOptionalParam('baseURI', 'baseURI')
  .addOptionalParam('name', 'name')
  .addOptionalParam('symbol', 'symbol')
  .addOptionalParam('owner', 'owner')
  .addFlag('log', 'log')
  .addFlag('verify', 'Verify Etherscan Contract')
  .setAction(deploiementAction);
