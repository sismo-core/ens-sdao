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
} from '../../types';

const GAS_PRICE = BigNumber.from('160000000000');

task('deploy-ens-full')
  .addFlag('verify', 'Verify Etherscan Contract')
  .setAction(async ({}, hre: HardhatRuntimeEnvironment) => {
    await logHre(hre);
    const deployer = await getDeployer(hre, true);
    const ensDeployer = (await new ENSDeployer__factory(
      deployer
    ).deploy()) as ENSDeployer;
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
    console.log(
      `Deployed by ${deployer.address}. registry ${registry.address}`
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
