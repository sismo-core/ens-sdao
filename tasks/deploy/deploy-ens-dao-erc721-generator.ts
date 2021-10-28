import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
//@ts-ignore
import nameHash from 'eth-ens-namehash';
import { getDeployer, logHre } from '../utils';
import {
  ENSDaoRegistrarPresetERC721Generator,
  ENSDaoRegistrarPresetERC721Generator__factory,
  ERC721Minter,
  ERC721Minter__factory,
} from '../../types';

type DeployEnsDaoERC721GeneratorArgs = {
  // ENS Registry address
  ens: string;
  // Public Resolver address
  resolver: string;
  // name of the .eth domain, the NFT name will be `${name}.eth DAO`
  name: string;
  // symbol of the DAO Token
  symbol: string;
  // owner address of the contracts
  owner?: string;
  // enabling logging
  log?: boolean;
};

export type DeployedEnsDaoERC721Generator = {
  ensDaoRegistrar: ENSDaoRegistrarPresetERC721Generator;
  erc721Token: ERC721Minter;
};

async function deploiementAction(
  {
    ens,
    resolver,
    name = 'sismo',
    symbol = 'SDAO',
    owner: optionalOwner,
    log,
  }: DeployEnsDaoERC721GeneratorArgs,
  hre: HardhatRuntimeEnvironment
): Promise<DeployedEnsDaoERC721Generator> {
  if (log) await logHre(hre);

  const deployer = await getDeployer(hre, log);

  const owner = optionalOwner || deployer.address;

  const node = nameHash.hash(`${name}.eth`);

  const deployedToken = await hre.deployments.deploy('ERC721Minter', {
    from: deployer.address,
    args: [`${name}.eth DAO`, symbol, 'https://tokens.sismo.io/', owner],
  });
  const deployedRegistrar = await hre.deployments.deploy(
    'ENSDaoRegistrarPresetERC721Generator',
    {
      from: deployer.address,
      args: [ens, resolver, deployedToken.address, node, name, owner],
    }
  );

  const ensDaoRegistrar = ENSDaoRegistrarPresetERC721Generator__factory.connect(
    deployedRegistrar.address,
    deployer
  );
  const erc721Token = ERC721Minter__factory.connect(
    deployedToken.address,
    deployer
  );

  // Allow the ERC721 Token to be minted by the deployed ENS DAO Registrar
  const MINTER_ROLE = hre.ethers.utils.solidityKeccak256(
    ['string'],
    ['MINTER_ROLE']
  );
  await (
    await erc721Token.grantRole(MINTER_ROLE, ensDaoRegistrar.address)
  ).wait();

  if (log) {
    console.log(`Deployed ERC721 Token: ${erc721Token.address}`);
    console.log(`Deployed ENS DAO Registrar: ${deployedRegistrar.address}`);
  }

  return {
    ensDaoRegistrar,
    erc721Token,
  };
}

task('deploy-ens-dao-erc721-generator')
  .addOptionalParam('ens', 'ens')
  .addOptionalParam('resolver', 'resolver')
  .addOptionalParam('baseURI', 'baseURI')
  .addOptionalParam('name', 'name')
  .addOptionalParam('symbol', 'symbol')
  .addOptionalParam('owner', 'owner')
  .addFlag('log', 'log')
  .addFlag('verify', 'Verify Etherscan Contract')
  .setAction(deploiementAction);
