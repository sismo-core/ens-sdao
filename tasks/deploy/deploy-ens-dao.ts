import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { BigNumber, ethers } from 'ethers';
import { getDeployer, logHre } from '../../evm-utils';
import { ENSDaoRegistrar__factory, ENSDaoToken__factory } from '../../types';
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
      const deployedDaoToken = await hre.deployments.deploy('ENSDaoToken', {
        from: deployer.address,
        args: [
          name + '.eth DAO',
          symbol,
          'https://tokens.sismo.io/',
          deployer.address,
        ],
      });
      const deployedRegistrar = await hre.deployments.deploy(
        'ENSDaoRegistrar',
        {
          from: deployer.address,
          args: [
            ens,
            resolver,
            nameWrapper,
            deployedDaoToken.address,
            node,
            name,
          ],
        }
      );
      if (log) {
        console.log(`Deployed ENS DAO Token: ${deployedDaoToken.address}`);
        console.log(`Deployed ENS DAO Registrar: ${deployedRegistrar.address}`);
      }
      const ensDaoRegistrar = ENSDaoRegistrar__factory.connect(
        deployedRegistrar.address,
        deployer
      );
      const ensDaoToken = ENSDaoToken__factory.connect(
        deployedDaoToken.address,
        deployer
      );
      await (await ensDaoToken.setMinter(ensDaoRegistrar.address)).wait();
      return {
        ensDaoRegistrar,
        ensDaoToken,
      };
    }
  );
