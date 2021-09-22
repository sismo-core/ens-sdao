import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { BigNumber } from 'ethers';
import { getDeployer, logHre } from '../../evm-utils';
import { ENSDeployer } from 'types';
import { ENSDeployer__factory } from '../../types/factories/ENSDeployer__factory';
import { ENSRegistry__factory } from '../../types/factories/ENSRegistry__factory';
import { FIFSRegistrar__factory } from '../../types/factories/FIFSRegistrar__factory';
import { ReverseRegistrar__factory } from '../../types/factories/ReverseRegistrar__factory';
import { PublicResolver__factory } from '../../types/factories/PublicResolver__factory';

const GAS_PRICE = BigNumber.from('160000000000');

task('deploy-ens')
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
    const registrar = FIFSRegistrar__factory.connect(
      await ensDeployer.fifsRegistrar(),
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
    console.log(
      `Deployed by ${deployer.address}. registry ${registry.address}`
    );

    return {
      ensDeployer,
      registry,
      registrar,
      reverseRegistrar,
      publicResolver,
    };
  });
