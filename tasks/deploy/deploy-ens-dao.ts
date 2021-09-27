import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { BigNumber, ethers } from 'ethers';
import { getDeployer, logHre } from '../../evm-utils';
import { ENSDAO__factory } from '../../types';
//@ts-ignore
import nameHash from 'eth-ens-namehash';
task('deploy-ens-dao')
  .addOptionalParam('ens', 'ens')
  .addOptionalParam('resolver', 'resolver')
  .addOptionalParam('nameWrapper', 'nameWrapper')
  .addOptionalParam('baseURI', 'baseURI')
  .addOptionalParam('name', 'name')
  .addOptionalParam('symbol', 'symbol')
  .addOptionalParam('log', 'log')
  .addFlag('verify', 'Verify Etherscan Contract')
  .setAction(
    async (
      {
        ens,
        resolver,
        nameWrapper = ethers.constants.AddressZero,
        baseURI = '',
        // this is the name of the .eth domain
        // the NFT name will be sismo.eth DAO Token
        name = 'sismo',
        symbol = 'SISMO',
        log = false,
      },
      hre: HardhatRuntimeEnvironment
    ) => {
      log && (await logHre(hre));
      const deployer = await getDeployer(hre, log);
      const node = nameHash.hash(name + '.eth');
      const deployed = await hre.deployments.deploy('ENSDAO', {
        from: deployer.address,
        args: [ens, resolver, nameWrapper, node, baseURI, name, symbol],
      });
      if (log) {
        console.log(`Deployed ENS DAO: ${deployed.address}`);
      }
      return ENSDAO__factory.connect(deployed.address, deployer);
    }
  );
