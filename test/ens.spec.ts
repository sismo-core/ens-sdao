import { expect } from 'chai';
//@ts-ignore
import ENS, { getEnsAddress } from '@ensdomains/ensjs';
import HRE, { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import {
  ENSDeployer,
  ENSRegistry,
  FIFSRegistrar,
  ReverseRegistrar,
  PublicResolver,
} from '../types';
//@ts-ignore
import nameHash from 'eth-ens-namehash';

describe('ENS', () => {
  let ensDeployer: ENSDeployer;
  let registrar: FIFSRegistrar;
  let registry: ENSRegistry;
  let reverseRegistrar: ReverseRegistrar;
  let publicResolver: PublicResolver;
  let userSigner: SignerWithAddress;
  let ownerSigner: SignerWithAddress;
  let ens: any;
  before(async () => {
    [userSigner, ownerSigner] = await HRE.ethers.getSigners();
    const deployedENS: {
      ensDeployer: ENSDeployer;
      registry: ENSRegistry;
      registrar: FIFSRegistrar;
      reverseRegistrar: ReverseRegistrar;
      publicResolver: PublicResolver;
    } = await HRE.run('deploy-ens');
    ensDeployer = deployedENS.ensDeployer;
    registrar = deployedENS.registrar;
    registry = deployedENS.registry;
    reverseRegistrar = deployedENS.reverseRegistrar;
    publicResolver = deployedENS.publicResolver;
  });
  it('Register with contracts', async () => {
    const bytes32Domain = ethers.utils.formatBytes32String('lolo');

    await registrar.register(
      bytes32Domain,
      await registrar.signer.getAddress()
    );

    await reverseRegistrar.setName('lolo.eth');

    ens = await new ENS({
      provider: HRE.ethers.provider,
      ensAddress: registry.address,
    });
    const TLD_LABEL = await ensDeployer.TLD_LABEL();
    const rootNode = await ensDeployer.namehash(
      '0x0000000000000000000000000000000000000000000000000000000000000000',
      TLD_LABEL
    );
    const node = await ensDeployer.namehash(rootNode, bytes32Domain);

    // userSigner is the owner
    expect(await registry.owner(node)).to.be.equal(userSigner.address);

    // userSigner has set the reverse ENS to lolo.eth
    expect((await ens.getName(userSigner.address)).name).to.be.equal(
      'lolo.eth'
    );

    // setting a record
    await (
      await registry.setRecord(
        node,
        userSigner.address,
        publicResolver.address,
        60
      )
    ).wait();

    await (await registry.setResolver(node, publicResolver.address)).wait();

    expect(await registry.recordExists(node)).to.be.true;
    expect(await registry.resolver(node)).to.be.equal(publicResolver.address);
    await publicResolver.functions['setAddr(bytes32,address)'](
      node,
      userSigner.address
    );
    console.log(await publicResolver.functions['addr(bytes32)'](node));
    // [ '0x5bB6Bf54C45bad2C73968Cb91fe0932D0f23f017' ] = OK
    console.log(await ens.name('lolo.eth').getAddress());
    // 0x0000000000000000000000000000000000000000
  });
  it('Should register with lib', async () => {
    const bytes32Domain = ethers.utils.formatBytes32String('lolo');
    console.log(0);
    const name = nameHash.hash('lolo.eth');

    await registrar.register(name, await registrar.signer.getAddress());
    await (
      await registry.setRecord(
        name,
        userSigner.address,
        publicResolver.address,
        60
      )
    ).wait();

    ens = await new ENS({
      provider: HRE.ethers.provider,
      ensAddress: registry.address,
      signer: HRE.ethers.provider.getSigner(),
    });

    console.log(1);
    await ens.name('lolo.eth').setResolver(publicResolver.address);
    console.log(1);
  });
});
