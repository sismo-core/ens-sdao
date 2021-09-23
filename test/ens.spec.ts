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
} from '../types';
//@ts-ignore
import nameHash from 'eth-ens-namehash';
const utils = ethers.utils;
const getLabelhash = (label: string) =>
  utils.keccak256(utils.toUtf8Bytes(label));
let label: string;
let labelhash: string;
let domain: string;
let node: string;

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
  let ens: any;
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
      // set address in resolver
      const newUserAddress = '0xEA674fdDe714fd979de3EdF0F56AA9716B898ec8';
      const label = 'newUser.sismo';
      const labelHash = getLabelhash(label);

      await ens.name(domain).createSubdomain('newUser');
      await ens.name('newUser.' + domain).setResolver(publicResolver.address);
      await ens.name('newUser.' + domain).setAddress('ETH', newUserAddress);

      expect(await ens.name('newUser.' + domain).getAddress()).to.be.equal(
        newUserAddress
      );
      // ERC721 Issue with FIFS
      // await nameWrapper.wrapETH2LD(
      //   'newUser.sismo',
      //   newUserAddress,
      //   0,
      //   publicResolver.address
      // );
      console.log(
        'name wrapper',
        await nameWrapper.balanceOf(newUserAddress, labelHash),
        await nameWrapper.balanceOf(userSigner.address, labelHash),
        await nameWrapper.balanceOf(ownerSigner.address, labelHash)
      );
    });
  });
});
