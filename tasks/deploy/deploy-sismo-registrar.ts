import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { BigNumber, ethers } from 'ethers';
import { getDeployer, logHre } from '../../evm-utils';
import {
  ENSDeployer__factory,
  BaseRegistrarImplementation__factory,
  ENS__factory,
  ReverseRegistrar__factory,
  PublicResolver__factory,
  NameWrapper__factory,
  ENSDeployer,
  ERC721FIFSRegistrar__factory,
} from '../../types';
//@ts-ignore
import nameHash from 'eth-ens-namehash';
import { utils } from 'ethers';

const GAS_PRICE = BigNumber.from('160000000000');
const getLabelhash = (label: string) =>
  utils.keccak256(utils.toUtf8Bytes(label));

task('deploy-ens-sismo-registrar')
  .addParam('domain', 'domain')
  .addOptionalParam('ens', 'ens')
  .addOptionalParam('resolver', 'resolver')
  .addOptionalParam('nameWrapper', 'nameWrapper')
  .addOptionalParam('baseURI', 'baseURI')
  .addOptionalParam('name', 'name')
  .addOptionalParam('symbol', 'symbol')
  .addFlag('verify', 'Verify Etherscan Contract')
  .setAction(
    async (
      {
        domain,
        ens = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
        resolver = '0xf6305c19e814d2a75429Fd637d01F7ee0E77d615',
        nameWrapper = ethers.constants.AddressZero,
        baseURI = '',
        name = 'αSismoRegistrar',
        symbol = 'αSISMO',
      },
      hre: HardhatRuntimeEnvironment
    ) => {
      await logHre(hre);
      const deployer = await getDeployer(hre, true);
      const node = nameHash.hash(domain);
      const deployed = await hre.deployments.deploy('ERC721FIFSRegistrar', {
        from: deployer.address,
        args: [ens, resolver, nameWrapper, node, baseURI, name, symbol],
      });
      console.log(`Deployed SISMO REGISTRAR ${deployed.address}`);
      return ERC721FIFSRegistrar__factory.connect(deployed.address, deployer);
    }
  );
