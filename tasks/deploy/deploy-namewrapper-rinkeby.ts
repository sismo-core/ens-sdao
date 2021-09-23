import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { BigNumber } from 'ethers';
import { getDeployer, logHre } from '../../evm-utils';
import {
  ENSDeployer__factory,
  BaseRegistrarImplementation__factory,
  ENS__factory,
  ReverseRegistrar__factory,
  PublicResolver__factory,
  NameWrapper__factory,
  ENSDeployer,
} from '../../types';

const GAS_PRICE = BigNumber.from('160000000000');

task('deploy-ens-rinkeby')
  .addFlag('verify', 'Verify Etherscan Contract')
  .setAction(async ({}, hre: HardhatRuntimeEnvironment) => {
    await logHre(hre);
    const deployer = await getDeployer(hre, true);

    const registrar = BaseRegistrarImplementation__factory.connect(
      '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
      deployer
    );
    const registry = ENS__factory.connect(
      '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
      deployer
    );
    const nameWrapper = await new NameWrapper__factory(deployer).deploy(
      registry.address,
      registrar.address,
      hre.ethers.constants.AddressZero
    );

    const publicResolver = await new PublicResolver__factory(deployer).deploy(
      registry.address,
      nameWrapper.address
    );

    console.log(
      `Deployed by ${deployer.address}. nameWrapper ${nameWrapper.address}`
    );
    console.log(
      `Deployed by ${deployer.address}. nameWrapper ${publicResolver.address}`
    );
  });
