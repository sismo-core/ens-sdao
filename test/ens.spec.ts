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
const utils = ethers.utils;
const getLabelhash = (label: string) =>
  utils.keccak256(utils.toUtf8Bytes(label));
const label = 'lolo';
const domain = `${label}.eth`;
const node = nameHash.hash(domain);
const labelhash = getLabelhash(label);
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
    await registrar.register(labelhash, await registrar.signer.getAddress());

    await reverseRegistrar.setName(domain);

    ens = await new ENS({
      provider: HRE.ethers.provider,
      ensAddress: registry.address,
    });

    // userSigner is the owner
    expect(await registry.owner(node)).to.be.equal(userSigner.address);

    // userSigner has set the reverse ENS to lolo.eth
    expect((await ens.getName(userSigner.address)).name).to.be.equal(
      'lolo.eth'
    );

    await (await registry.setResolver(node, publicResolver.address)).wait();

    expect(await registry.recordExists(node)).to.be.true;
    expect(await registry.resolver(node)).to.be.equal(publicResolver.address);
    await publicResolver.functions['setAddr(bytes32,address)'](
      node,
      userSigner.address
    );
    console.log(await publicResolver.functions['addr(bytes32)'](node));
    // [ '0x5bB6Bf54C45bad2C73968Cb91fe0932D0f23f017' ] = OK
    console.log(await ens.name(domain).getAddress());
    // 0x0000000000000000000000000000000000000000
  });
  it('Should register with lib', async () => {
    await registrar.register(labelhash, await registrar.signer.getAddress());

    ens = await new ENS({
      provider: HRE.ethers.provider,
      ensAddress: registry.address,
      signer: HRE.ethers.provider.getSigner(),
    });
    const newaddress = '0x0000000000000000000000000000000000012345';
    await ens.name(domain).setResolver(publicResolver.address);
    await ens.name(domain).setAddress('ETH', newaddress);
    const addr = await ens.name(domain).getAddress();
    expect(addr).to.be.equal(newaddress);
  });
});
