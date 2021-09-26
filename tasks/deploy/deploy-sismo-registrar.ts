import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { BigNumber, ethers } from 'ethers';
import { getDeployer, logHre } from '../../evm-utils';
import { EthDomainRegistrar__factory } from '../../types';
//@ts-ignore
import nameHash from 'eth-ens-namehash';
task('deploy-eth-domain-registrar')
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
        name = 'αSismoRegistrar',
        symbol = 'αSISMO',
        log = false,
      },
      hre: HardhatRuntimeEnvironment
    ) => {
      log && (await logHre(hre));
      const deployer = await getDeployer(hre, log);
      const node = nameHash.hash(name + '.eth');
      const deployed = await hre.deployments.deploy('EthDomainRegistrar', {
        from: deployer.address,
        args: [ens, resolver, nameWrapper, node, baseURI, name, symbol],
      });
      if (log) {
        console.log(`Deployed SISMO REGISTRAR ${deployed.address}`);
      }
      return EthDomainRegistrar__factory.connect(deployed.address, deployer);
    }
  );
