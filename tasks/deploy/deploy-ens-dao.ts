import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ethers } from 'ethers';
import { getDeployer, logHre } from '../../evm-utils';
import {
  ENSDaoRegistrar__factory,
  ENSDaoToken__factory,
  ENSLabelBooker__factory,
} from '../../types';
//@ts-ignore
import nameHash from 'eth-ens-namehash';
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
        symbol = 'SDAO',
        log = false,
        owner,
        reservationDuration = (7 * 24 * 3600).toString(),
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
          owner || deployer.address,
        ],
      });
      const deployedLabelBooker = await hre.deployments.deploy(
        'ENSLabelBooker',
        {
          from: deployer.address,
          args: [ens, node, owner || deployer.address],
        }
      );
      const deployedRegistrar = await hre.deployments.deploy(
        'ENSDaoRegistrar',
        {
          from: deployer.address,
          args: [
            ens,
            resolver,
            nameWrapper,
            deployedDaoToken.address,
            deployedLabelBooker.address,
            node,
            name,
            owner || deployer.address,
            reservationDuration,
          ],
        }
      );

      const ensDaoRegistrar = ENSDaoRegistrar__factory.connect(
        deployedRegistrar.address,
        deployer
      );
      const ensDaoLabelBooker = ENSLabelBooker__factory.connect(
        deployedLabelBooker.address,
        deployer
      );
      const ensDaoToken = ENSDaoToken__factory.connect(
        deployedDaoToken.address,
        deployer
      );
      await (
        await ensDaoLabelBooker.setRegistrar(ensDaoRegistrar.address)
      ).wait();
      if (log) {
        console.log(`Deployed ENS DAO Token: ${deployedDaoToken.address}`);
        console.log(
          `Deployed ENS DAO Label Book: ${deployedLabelBooker.address}`
        );
        console.log(`Deployed ENS DAO Registrar: ${deployedRegistrar.address}`);
      }
      await (await ensDaoToken.setMinter(ensDaoRegistrar.address)).wait();
      return {
        ensDaoRegistrar,
        ensDaoLabelBooker,
        ensDaoToken,
      };
    }
  );
