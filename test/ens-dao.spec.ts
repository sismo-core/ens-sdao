import { expect } from 'chai';
//@ts-ignore
import ENS from '@ensdomains/ensjs';
import HRE, { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import {
  ENSDeployer,
  ENSRegistry,
  EthRegistrar,
  ReverseRegistrar,
  PublicResolver,
  NameWrapper,
  ENSDaoRegistrar,
  ENSDaoToken,
} from '../types';
//@ts-ignore
import packet from 'dns-packet';
//@ts-ignore
import nameHash from 'eth-ens-namehash';
import { increaseTime } from '../evm-utils';
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
const year = 365 * 24 * 60 * 60;
describe('ENS', () => {
  let ensDeployer: ENSDeployer;
  // .eth registrar
  let registrar: EthRegistrar;
  let registry: ENSRegistry;
  let reverseRegistrar: ReverseRegistrar;
  let publicResolver: PublicResolver;
  let userSigner: SignerWithAddress;
  let ownerSigner: SignerWithAddress;
  let otherSigner: SignerWithAddress;
  let nameWrapper: NameWrapper;
  let ensDaoRegistrar: ENSDaoRegistrar;
  let ensDaoToken: ENSDaoToken;
  let ens: any;
  let tokenId: string;
  before(async () => {
    [ownerSigner, userSigner, otherSigner] = await HRE.ethers.getSigners();
    const deployedENS: {
      ensDeployer: ENSDeployer;
      registry: ENSRegistry;
      registrar: EthRegistrar;
      reverseRegistrar: ReverseRegistrar;
      publicResolver: PublicResolver;
      nameWrapper: NameWrapper;
    } = await HRE.run('deploy-ens-full');
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
  describe('ENS: Register domain, set owners, set lookup and reverse lookup, create subdomain', async () => {
    it('owner registers dhadrien.eth for themselves', async () => {
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
    it('user set the reverse lookup to dhadrien.eth', async () => {
      await reverseRegistrar.connect(userSigner).setName(domain);
      expect((await ens.getName(userSigner.address)).name).to.be.equal(
        'dhadrien.eth'
      );
    });
    it('user set dhadrien.eth => its address', async () => {
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
  });
  describe('ENS: NameWrapper', async () => {
    it('Should register sismo.eth with contract, do the rest with lib', async () => {
      label = 'sismo';
      labelhash = getLabelhash(label);
      domain = `${label}.eth`;
      node = nameHash.hash(domain);
      await registrar.register(labelhash, ownerSigner.address, year);
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
      const userLabel = 'user';
      const userLabelHash = getLabelhash(userLabel);
      const subdomainNode = nameHash.hash(subdomain);
      const userNode = nameHash.hash(`${userLabel}.${subdomain}`);
      // const userNode = keccak256(
      //   ethers.utils.solidityPack(
      //     ['bytes', 'bytes'],
      //     [subdomainNode, userLabelHash]
      //   )
      // );

      expect(
        await nameWrapper.balanceOf(ownerSigner.address, userNode)
      ).to.be.equal(0);

      await nameWrapper.setSubnodeRecordAndWrap(
        subdomainNode,
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
  describe('ENS DAO: Create a registrar for yourdomain.eth and let user register user.yourdomain.eth freely', async () => {
    it('deploy the ENS dao that will own sismo.eth', async () => {
      const ensDaoDeployment: {
        ensDaoRegistrar: ENSDaoRegistrar;
        ensDaoToken: ENSDaoToken;
      } = await HRE.run('deploy-ens-dao', {
        // name NEEEDS to be label of .eth name
        name: 'sismo',
        symbol: 'SISMO',
        ens: registry.address,
        resolver: publicResolver.address,
        nameWrapper: nameWrapper.address,
        reverseRegistrar: reverseRegistrar.address,
      });
      ensDaoToken = ensDaoDeployment.ensDaoToken;
      ensDaoRegistrar = ensDaoDeployment.ensDaoRegistrar;
      tokenId = ethers.BigNumber.from(getLabelhash('sismo')).toString();
    });
    it('sismo.eth owner wrap and gives wrapped ownership to sismo.eth ENS DAO', async () => {
      await registry.setApprovalForAll(nameWrapper.address, true);
      await (await registrar.approve(nameWrapper.address, tokenId)).wait();
      await nameWrapper
        .connect(ownerSigner)
        .wrapETH2LD(
          'sismo',
          ensDaoRegistrar.address,
          0,
          publicResolver.address
        );
    });
    it('not owners of vitalik.eth/ dhadrien.eth cannot register vitalik.sismo.eth', async () => {
      await registrar.register(
        getLabelhash('vitalik'),
        ownerSigner.address,
        year
      );
      await expect(
        ensDaoRegistrar.connect(otherSigner).register('vitalik')
      ).to.be.revertedWith('ENS_DAO: subdomain reserved for .eth holder');
      // registered in previous test, owner is userSigner
      await expect(
        ensDaoRegistrar.connect(otherSigner).register('dhadrien')
      ).to.be.revertedWith('ENS_DAO: subdomain reserved for .eth holder');
    });
    it('not owner of vitalik.eth can register vitalik.sismo.eth after 1 week', async () => {
      // 1 week  + 5 sec
      await increaseTime(
        HRE,
        (await ensDaoRegistrar.RESERVATION_PERIOD()).toNumber() + 5
      );
      const domain = `vitalik.sismo.eth`;

      await ensDaoRegistrar.connect(otherSigner).register('vitalik');
      expect(await ens.name(domain).getAddress()).to.be.equal(
        otherSigner.address
      );
    });
    it('owner of dhadrien.eth can register dhadrien.sismo.eth, get the wrapped subdomain', async () => {
      const userLabel = 'dhadrien';
      const domain = `${userLabel}.sismo.eth`;
      const userNode = nameHash.hash(domain);
      await (
        await ensDaoRegistrar.connect(userSigner).register('dhadrien')
      ).wait();
      expect(await ens.name(domain).getAddress()).to.be.equal(
        userSigner.address
      );
      expect(await ensDaoToken.ownerOf(userNode)).to.be.equal(
        userSigner.address
      );

      expect(
        await nameWrapper.isTokenOwnerOrApproved(userNode, userSigner.address)
      ).to.be.equal(true);
      expect(await nameWrapper.ownerOf(userNode)).to.be.equal(
        userSigner.address
      );
      expect(await registry.owner(userNode)).to.be.equal(nameWrapper.address);
    });
    it('User cannot gen another subdomain', async () => {
      await expect(
        ensDaoRegistrar.connect(userSigner).register('dhadrien2')
      ).to.be.revertedWith('ENSDAO: TOO_MANY_SUBDOMAINS');
    });
    it('User cannot gen another subdomain', async () => {
      await expect(
        ensDaoRegistrar.connect(userSigner).register('dhadrien2')
      ).to.be.revertedWith('ENSDAO: TOO_MANY_SUBDOMAINS');
    });
    it('User should be able to unwrap', async () => {
      const userLabel = 'dhadrien';
      const labelHash = getLabelhash(userLabel);
      const parentNode = nameHash.hash('sismo.eth');
      const domain = `${userLabel}.sismo.eth`;
      const userNode = nameHash.hash(domain);
      await nameWrapper
        .connect(userSigner)
        .unwrap(parentNode, labelHash, userSigner.address);
      expect(await registry.owner(userNode)).to.be.equal(userSigner.address);
    });
    it('Sismo.eth initial owner should be able to get back ownership, get back the Eth ERC721 NFT', async () => {
      const ethEnsBalanceBefore = await registrar.balanceOf(
        ownerSigner.address
      );
      await (
        await ensDaoRegistrar.connect(ownerSigner).unwrapToDaoOwner()
      ).wait();
      expect(await registrar.balanceOf(ownerSigner.address)).to.be.equal(
        ethEnsBalanceBefore.add(1)
      );
    });
  });
});
