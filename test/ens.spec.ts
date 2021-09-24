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
  NameWrapper,
  ERC721FIFSRegistrar,
  ERC721FIFSRegistrar__factory,
} from '../types';
//@ts-ignore
import packet from 'dns-packet';
//@ts-ignore
import nameHash from 'eth-ens-namehash';
import { keccak256 } from '@ethersproject/keccak256';
const utils = ethers.utils;
const getLabelhash = (label: string) =>
  utils.keccak256(utils.toUtf8Bytes(label));
let label: string;
let labelhash: string;
let domain: string;
let node: string;

function encodeName(name: string) {
  return '0x' + packet.name.encode(name).toString('hex');
}

describe('ENS', () => {
  let ensDeployer: ENSDeployer;
  // .eth registrar
  let registrar: FIFSRegistrar;
  let registry: ENSRegistry;
  let reverseRegistrar: ReverseRegistrar;
  let publicResolver: PublicResolver;
  let userSigner: SignerWithAddress;
  let ownerSigner: SignerWithAddress;
  let nameWrapper: NameWrapper;
  let sismoRegistrar: ERC721FIFSRegistrar;
  let ens: any;
  let tokenId: string;
  before(async () => {
    [ownerSigner, userSigner] = await HRE.ethers.getSigners();
    const deployedENS: {
      ensDeployer: ENSDeployer;
      registry: ENSRegistry;
      registrar: FIFSRegistrar;
      reverseRegistrar: ReverseRegistrar;
      publicResolver: PublicResolver;
      nameWrapper: NameWrapper;
    } = await HRE.run('deploy-ens');
    ensDeployer = deployedENS.ensDeployer;
    registrar = deployedENS.registrar;
    registry = deployedENS.registry;
    reverseRegistrar = deployedENS.reverseRegistrar;
    publicResolver = deployedENS.publicResolver;
    nameWrapper = deployedENS.nameWrapper;
    label = 'dhadrien';
    labelhash = getLabelhash(label);
    domain = `${label}.eth`;
    tokenId = ethers.BigNumber.from(labelhash).toString();
    node = nameHash.hash(domain);
    ens = await new ENS({
      provider: HRE.ethers.provider,
      ensAddress: registry.address,
    });
  });
  describe('Setting dhadrien.eth <> userSigner address with contracts', async () => {
    it('owner registers dhadrien.eth for themself', async () => {
      await registrar.register(labelhash, ownerSigner.address);
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
    it('user set the reverse lookup to dhadrien.eth', async () => {
      await reverseRegistrar.connect(userSigner).setName(domain);
      expect((await ens.getName(userSigner.address)).name).to.be.equal(
        'dhadrien.eth'
      );
    });
    it('user registers dhadrien.eth', async () => {
      expect(await registry.resolver(node)).to.be.equal(
        ethers.constants.AddressZero
      );
      // setting the resolver in the record: now dhadrien.eth uses publicResolver to resolve
      await (
        await registry
          .connect(userSigner)
          .setResolver(node, publicResolver.address)
      ).wait();
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
      expect(await ens.name(domain).getAddress()).to.be.equal(
        userSigner.address
      );
    });
    it('user registers iam.dhadrien.eth', async () => {
      label = 'iam';
      labelhash = getLabelhash(label);
      domain = `${label}.dhadrien.eth`;
      const oldNode = node;
      node = nameHash.hash(domain);
      tokenId = ethers.BigNumber.from(labelhash).toString();
      expect(await registry.resolver(node)).to.be.equal(
        ethers.constants.AddressZero
      );
      await registry
        .connect(userSigner)
        .setSubnodeOwner(oldNode, labelhash, userSigner.address);
      // setting the resolver in the record: now dhadrien.eth uses publicResolver to resolve
      await (
        await registry
          .connect(userSigner)
          .setResolver(node, publicResolver.address)
      ).wait();
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
      expect(await ens.name(domain).getAddress()).to.be.equal(
        userSigner.address
      );
    });
    it('Should register sismo.eth with contract, do the rest with lib', async () => {
      label = 'sismo';
      labelhash = getLabelhash(label);
      domain = `${label}.eth`;
      node = nameHash.hash(domain);
      await registrar.register(labelhash, ownerSigner.address);
      // set resolver
      await ens.name(domain).setResolver(publicResolver.address);
      expect(await ens.name(domain).getAddress()).to.be.equal(
        ethers.constants.AddressZero
      );
      // set address in resolver
      await ens.name(domain).setAddress('ETH', userSigner.address);
      expect(await ens.name(domain).getAddress()).to.be.equal(
        userSigner.address
      );
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
      expect(await ens.name(userDomain).getAddress()).to.be.equal(
        newUserAddress
      );
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
      const userLabel = 'newUser';
      const userLabelHash = getLabelhash(userLabel);
      const subdomainNode = nameHash.hash(subdomain);
      // this is wrong don't use the following!!
      // const userNode = nameHash.hash(`${userLabel}.${subdomain}`);
      // letting it here in case people have same issue
      const userNode = keccak256(
        ethers.utils.solidityPack(
          ['bytes', 'bytes'],
          [subdomainNode, userLabelHash]
        )
      );

      expect(
        await nameWrapper.balanceOf(ownerSigner.address, userNode)
      ).to.be.equal(0);

      await nameWrapper.setSubnodeRecordAndWrap(
        subdomainNode,
        'newUser',
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

    it('deploy a registrar that will own sismo.eth', async () => {
      sismoRegistrar = await HRE.run('deploy-ens-sismo-registrar', {
        domain: 'sismo.eth',
        ens: registry.address,
        resolver: publicResolver.address,
      });
    });
    it('sismo.eth owner gives ownership to registrar', async () => {
      await registry.setOwner(node, sismoRegistrar.address);
      expect(await registry.owner(node)).to.be.equal(sismoRegistrar.address);
    });
    it('a user can register and own iam.sismo.eth', async () => {
      await (
        await sismoRegistrar.register(getLabelhash('iam'), userSigner.address)
      ).wait();
      expect(await ens.name('iam.' + domain).getAddress()).to.be.equal(
        userSigner.address
      );
    });
    it('the user should have an alphaSismo NFT', async () => {
      expect(await sismoRegistrar.balanceOf(userSigner.address)).to.be.equal(1);
    });
    it('sismo.eth registrar can adbicate', async () => {
      await (await sismoRegistrar.abdicate()).wait();
      expect(await registry.owner(node)).to.be.equal(ownerSigner.address);
    });
    xit('try to do some wrappedname stuff', async () => {
      const newUserAddress = '0xEA674fdDe714fd979de3EdF0F56AA9716B898ec8';
      await (
        await registrar.setApprovalForAll(nameWrapper.address, true)
      ).wait();
      await nameWrapper.wrapETH2LD(
        'sismo',
        newUserAddress,
        0,
        publicResolver.address
      );
      //   'name wrapper',
      //   await nameWrapper.balanceOf(newUserAddress, tokenId),
      //   await nameWrapper.balanceOf(userSigner.address, tokenId),
      //   await nameWrapper.balanceOf(ownerSigner.address, tokenId)
      // );
    });
  });
});
