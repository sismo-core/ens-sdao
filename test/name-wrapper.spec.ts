import { expect } from 'chai';
//@ts-ignore
import ENS from '@ensdomains/ensjs';
import HRE, { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import {
  ENSRegistry,
  EthRegistrar,
  PublicResolver,
  NameWrapper,
} from '../types';
//@ts-ignore
import packet from 'dns-packet';
//@ts-ignore
import nameHash from 'eth-ens-namehash';
import { DeployedEns } from '../tasks';

describe('ENS Name Wrapper', () => {
  const getLabelhash = (label: string) =>
    ethers.utils.keccak256(ethers.utils.toUtf8Bytes(label));
  const encodeName = (name: string) =>
    `0x${packet.name.encode(name).toString('hex')}`;
  const year = 365 * 24 * 60 * 60;

  const label = 'sismo';
  const labelhash = getLabelhash(label);
  const domain = `${label}.eth`;

  let userSigner: SignerWithAddress;
  let ownerSigner: SignerWithAddress;

  let registrar: EthRegistrar;
  let registry: ENSRegistry;
  let publicResolver: PublicResolver;
  let nameWrapper: NameWrapper;
  let ens: ENS;

  before(async () => {
    const deployedENS: DeployedEns = await HRE.run('deploy-ens-full');
    ({ registrar, registry, nameWrapper, publicResolver } = deployedENS);

    ens = await new ENS({
      provider: HRE.ethers.provider,
      ensAddress: registry.address,
    });

    [ownerSigner, userSigner] = await HRE.ethers.getSigners();
  });

  it('Should register sismo.eth with contract, do the rest with lib', async () => {
    await registrar.register(labelhash, ownerSigner.address, year);
    // set resolver
    await ens.name(domain).setResolver(publicResolver.address);
    expect(await ens.name(domain).getAddress()).to.be.equal(
      ethers.constants.AddressZero
    );
    // set address in resolver
    await ens.name(domain).setAddress('ETH', userSigner.address);
    expect(await ens.name(domain).getAddress()).to.be.equal(userSigner.address);
  });
  it('Should register newUser.sismo.eth with lib', async () => {
    const userDomain = 'newUser.' + domain;
    expect(await registry.owner(nameHash.hash(userDomain))).to.be.equal(
      ethers.constants.AddressZero
    );
    const newUserAddress = '0xEA674fdDe714fd979de3EdF0F56AA9716B898ec8';
    await ens.name(domain).createSubdomain('newUser');
    expect(await registry.owner(nameHash.hash(userDomain))).to.be.equal(
      ownerSigner.address
    );

    await ens.name(userDomain).setResolver(publicResolver.address);
    expect(await registry.owner(nameHash.hash(userDomain))).to.be.equal(
      ownerSigner.address
    );

    await ens.name(userDomain).setAddress('ETH', newUserAddress);
    expect(await ens.name(userDomain).getAddress()).to.be.equal(newUserAddress);
  });
  it('Should register subdomain.sismo.eth with lib and wrap it', async () => {
    const userDomain = 'subdomain.' + domain;
    const userNode = nameHash.hash(userDomain);
    expect(await registry.owner(nameHash.hash(userDomain))).to.be.equal(
      ethers.constants.AddressZero
    );
    await ens.name(domain).createSubdomain('subdomain');

    await ens.name(userDomain).setResolver(publicResolver.address);

    await ens.name(userDomain).setAddress('ETH', ownerSigner.address);

    expect(await registry.owner(nameHash.hash(userDomain))).to.be.equal(
      ownerSigner.address
    );

    await registry.setApprovalForAll(nameWrapper.address, true);
    await nameWrapper.wrap(
      encodeName(userDomain),
      ownerSigner.address,
      0,
      publicResolver.address
    );
    expect(
      await nameWrapper.balanceOf(ownerSigner.address, userNode)
    ).to.be.equal(1);
  });
  it('Wrapped domain (subdomain.simsmo.eth) should be able to give subdomains to newUser', async () => {
    const subdomain = 'subdomain.sismo.eth';
    const userLabel = 'user';
    const subNode = nameHash.hash(subdomain);
    const userNode = nameHash.hash(`${userLabel}.${subdomain}`);

    expect(
      await nameWrapper.balanceOf(ownerSigner.address, userNode)
    ).to.be.equal(0);

    await nameWrapper.setSubnodeRecordAndWrap(
      subNode,
      userLabel,
      ownerSigner.address,
      publicResolver.address,
      0,
      0
    );
    expect(
      await nameWrapper.balanceOf(ownerSigner.address, userNode)
    ).to.be.equal(1);
    expect(await registry.owner(userNode)).to.be.equal(nameWrapper.address);
  });
});
