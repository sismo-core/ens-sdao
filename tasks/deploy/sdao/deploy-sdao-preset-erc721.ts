import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
//@ts-ignore
import nameHash from 'eth-ens-namehash';
import { getDeployer, logHre } from '../../utils';
import {
  SDaoRegistrarPresetERC721,
  SDaoRegistrarPresetERC721__factory,
  ERC721Minter,
  ERC721Minter__factory,
} from '../../../types';

type DeploySDaoPresetERC721Args = {
  // ENS Registry address
  ens: string;
  // Public Resolver address
  resolver: string;
  // name of the .eth domain, the NFT name will be `${name}.eth DAO`
  name: string;
  // symbol of the DAO Token
  symbol: string;
  // reservation duration of the Subdomain DAO Registrar
  reservationDuration?: string;
  // limit of registrations
  registrationLimit?: number;
  // owner address of the contracts
  owner?: string;
  // enabling logging
  log?: boolean;
};

export type DeployedSDaoPresetERC721 = {
  sDaoRegistrar: SDaoRegistrarPresetERC721;
  erc721Token: ERC721Minter;
};

async function deploiementAction(
  {
    ens,
    resolver,
    name = 'sismo',
    symbol = 'SDAO',
    reservationDuration = (4 * 7 * 24 * 3600).toString(),
    registrationLimit = 500,
    owner: optionalOwner,
    log,
  }: DeploySDaoPresetERC721Args,
  hre: HardhatRuntimeEnvironment
): Promise<DeployedSDaoPresetERC721> {
  if (log) await logHre(hre);

  const deployer = await getDeployer(hre, log);

  const owner = optionalOwner || deployer.address;

  const node = nameHash.hash(`${name}.eth`);

  const deployedToken = await hre.deployments.deploy('ERC721Minter', {
    from: deployer.address,
    args: [`${name}.eth DAO`, symbol, 'https://tokens.sismo.io/', owner],
  });
  const deployedRegistrar = await hre.deployments.deploy(
    'SDaoRegistrarPresetERC721',
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

  const sDaoRegistrar = SDaoRegistrarPresetERC721__factory.connect(
    deployedRegistrar.address,
    deployer
  );
  const erc721Token = ERC721Minter__factory.connect(
    deployedToken.address,
    deployer
  );

  // Allow the ERC721 Token to be minted by the deployed Subdomain DAO Registrar
  const MINTER_ROLE = hre.ethers.utils.solidityKeccak256(
    ['string'],
    ['MINTER_ROLE']
  );
  await (
    await erc721Token.grantRole(MINTER_ROLE, sDaoRegistrar.address)
  ).wait();

  if (log) {
    console.log(`Deployed ERC721 Token: ${erc721Token.address}`);
    console.log(
      `Deployed SDAO Registrar Preset ERC721: ${deployedRegistrar.address}`
    );
  }

  return {
    sDaoRegistrar,
    erc721Token,
  };
}

task('deploy-sdao-preset-erc721')
  .addOptionalParam('ens', 'ens')
  .addOptionalParam('resolver', 'resolver')
  .addOptionalParam('baseURI', 'baseURI')
  .addOptionalParam('name', 'name')
  .addOptionalParam('symbol', 'symbol')
  .addOptionalParam('owner', 'owner')
  .addFlag('log', 'log')
  .addFlag('verify', 'Verify Etherscan Contract')
  .setAction(deploiementAction);
