import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { BigNumber } from 'ethers';
import { getDeployer, logHre } from '../../evm-utils';
import {
  ENSDeployer__factory,
  ENSRegistry__factory,
  EthRegistrar__factory,
  ReverseRegistrar__factory,
  PublicResolver__factory,
  NameWrapper__factory,
  ENSDeployer,
  ENSDaoToken,
  ENSDaoRegistrar,
} from '../../types';

task('deploy-ens-full')
  .addFlag('ensDao', 'deploy ens-dao')
  .addFlag('log', 'logging deployments')
  .setAction(async ({ ensDao, log }, hre: HardhatRuntimeEnvironment) => {
    await logHre(hre);
    const deployer = await getDeployer(hre, log);
    const newEnsDeployer = await hre.deployments.deploy('ENSDeployer', {
      from: deployer.address,
      args: [],
    });
    const ensDeployer = ENSDeployer__factory.connect(
      newEnsDeployer.address,
      deployer
    );
    const registry = ENSRegistry__factory.connect(
      await ensDeployer.ens(),
      deployer
    );
    const registrar = EthRegistrar__factory.connect(
      await ensDeployer.ethRegistrar(),
      deployer
    );
    const reverseRegistrar = ReverseRegistrar__factory.connect(
      await ensDeployer.reverseRegistrar(),
      deployer
    );
    const publicResolver = PublicResolver__factory.connect(
      await ensDeployer.publicResolver(),
      deployer
    );
    const nameWrapper = NameWrapper__factory.connect(
      await ensDeployer.nameWrapper(),
      deployer
    );
    if (ensDao) {
      const {
        ensDaoRegistrar,
        ensDaoToken,
      }: { ensDaoRegistrar: ENSDaoRegistrar; ensDaoToken: ENSDaoToken } =
        await hre.run('deploy-ens-dao', {
          // name NEEEDS to be label of .eth name
          name: 'sismo',
          symbol: 'SISMO',
          ens: registry.address,
          resolver: publicResolver.address,
          nameWrapper: nameWrapper.address,
        });
      log &&
        console.log(
          `Deployed by ${deployer.address}.
        ensDeployer: ${ensDeployer.address}
        registry: ${registry.address}
        registrar: ${registrar.address}
        reverseRegistrar: ${reverseRegistrar.address}
        publicResolver: ${publicResolver.address}
        nameWrapper: ${nameWrapper.address}
        ensDaoRegistrar: ${ensDaoRegistrar.address}
        ensDaoRegistrar: ${ensDaoToken.address}
        `
        );
      return {
        ensDeployer,
        registry,
        registrar,
        reverseRegistrar,
        publicResolver,
        nameWrapper,
        ensDaoRegistrar,
        ensDaoToken,
      };
    }
    log &&
      console.log(
        `Deployed by ${deployer.address}.
        ensDeployer: ${ensDeployer.address}
        registry: ${registry.address}
        registrar: ${registrar.address}
        reverseRegistrar: ${reverseRegistrar.address}
        publicResolver: ${publicResolver.address}
        nameWrapper: ${nameWrapper.address}
        `
      );
    return {
      ensDeployer,
      registry,
      registrar,
      reverseRegistrar,
      publicResolver,
      nameWrapper,
    };
  });
