import { expect } from 'chai';
//@ts-ignore
import ENS from '@ensdomains/ensjs';
import HRE, { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import {
  ENSRegistry,
  EthRegistrar,
  ReverseRegistrar,
  PublicResolver,
} from '../types';
//@ts-ignore
import nameHash from 'eth-ens-namehash';
import { DeployedEns } from '../tasks';

describe('ENS: Register domain, set owners, set lookup and reverse lookup, create subdomain', () => {
  const getLabelhash = (label: string) =>
    ethers.utils.keccak256(ethers.utils.toUtf8Bytes(label));

  const year = 365 * 24 * 60 * 60;
  const label = 'sismo';
  const labelhash = getLabelhash(label);
  const domain = `${label}.eth`;
  const node = nameHash.hash(domain);

  let userSigner: SignerWithAddress;
  let ownerSigner: SignerWithAddress;

  let registrar: EthRegistrar;
  let reverseRegistrar: ReverseRegistrar;
  let registry: ENSRegistry;
  let publicResolver: PublicResolver;
  let ens: ENS;

  before(async () => {
    const deployedENS: DeployedEns = await HRE.run('deploy-ens-full');
    ({ registrar, registry, reverseRegistrar, publicResolver } = deployedENS);

    ens = await new ENS({
      provider: HRE.ethers.provider,
      ensAddress: registry.address,
    });

    [ownerSigner, userSigner] = await HRE.ethers.getSigners();
  });

  it(`owner registers ${domain} for themselves`, async () => {
    await registrar.register(labelhash, ownerSigner.address, year);
    expect(await registry.owner(node)).to.be.equal(ownerSigner.address);
    // record has just owner for now
    expect(await registry.recordExists(node)).to.be.true;
    // owner set but does not resolve yet!
    expect(await ens.name(domain).getAddress()).to.be.equal(
      ethers.constants.AddressZero
    );
  });
  it('owner gives ownership to user', async () => {
    await registry.setOwner(node, userSigner.address);
    expect(await registry.owner(node)).to.be.equal(userSigner.address);
    expect(await ens.name(domain).getAddress()).to.be.equal(
      ethers.constants.AddressZero
    );
  });
  it('owner can no longer set Owner', async () => {
    await expect(registry.setOwner(node, ownerSigner.address)).to.be.reverted;
    expect(await ens.name(domain).getAddress()).to.be.equal(
      ethers.constants.AddressZero
    );
  });
  it(`user set the reverse lookup to ${domain}`, async () => {
    await reverseRegistrar.connect(userSigner).setName(domain);
    expect((await ens.getName(userSigner.address)).name).to.be.equal(domain);
  });
  it(`user set ${domain} => its address`, async () => {
    expect(await registry.resolver(node)).to.be.equal(
      ethers.constants.AddressZero
    );
    // setting the resolver in the record: now <domain> uses publicResolver to resolve
    await registry
      .connect(userSigner)
      .setResolver(node, publicResolver.address);

    expect(await registry.resolver(node)).to.be.equal(publicResolver.address);
    // still does not resolve, we did not set the resolver
    expect(await ens.name(domain).getAddress()).to.be.equal(
      ethers.constants.AddressZero
    );

    // setting the public resolver to resolve address to user
    await publicResolver
      .connect(userSigner)
      .functions['setAddr(bytes32,address)'](node, userSigner.address);
    // checking with contracts
    expect(await publicResolver.functions['addr(bytes32)'](node)).to.be.eql([
      userSigner.address,
    ]);
    // checking with lib
    expect(await ens.name(domain).getAddress()).to.be.equal(userSigner.address);
  });

  it(`user registers iam.${domain}`, async () => {
    const subLabel = 'iam';
    const subLabelhash = getLabelhash(subLabel);
    const subDomain = `${subLabel}.${label}.eth`;
    const subNode = nameHash.hash(subDomain);
    expect(await registry.resolver(subNode)).to.be.equal(
      ethers.constants.AddressZero
    );
    await registry
      .connect(userSigner)
      .setSubnodeOwner(node, subLabelhash, userSigner.address);
    // setting the resolver in the record: now <domain> uses publicResolver to resolve
    await registry
      .connect(userSigner)
      .setResolver(subNode, publicResolver.address);
    expect(await registry.resolver(subNode)).to.be.equal(
      publicResolver.address
    );
    // still does not resolve, we did not set the resolver
    expect(await ens.name(subDomain).getAddress()).to.be.equal(
      ethers.constants.AddressZero
    );
    // setting the public resolver to resolve address to user
    await publicResolver
      .connect(userSigner)
      .functions['setAddr(bytes32,address)'](subNode, userSigner.address);
    // checking with contracts
    expect(await publicResolver.functions['addr(bytes32)'](subNode)).to.be.eql([
      userSigner.address,
    ]);
    // checking with lib
    expect(await ens.name(subDomain).getAddress()).to.be.equal(
      userSigner.address
    );
  });
});
