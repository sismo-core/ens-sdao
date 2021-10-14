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

type FullDeploiementResult = {
  ensDeployer: ENSDeployer;
  registry: ENSRegistry;
  registrar: EthRegistrar;
  reverseRegistrar: ReverseRegistrar;
  publicResolver: PublicResolver;
  nameWrapper: NameWrapper;
};

type EnsDeploiementResult = {
  ensDaoRegistrar: ENSDaoRegistrar;
  ensDaoToken: ENSDaoToken;
};

describe('ENS', () => {
  const utils = ethers.utils;
  const year = 365 * 24 * 60 * 60;

  const getLabelhash = (label: string) =>
    utils.keccak256(utils.toUtf8Bytes(label));
  const encodeName = (name: string) =>
    `0x${packet.name.encode(name).toString('hex')}`;

  let userSigner: SignerWithAddress;
  let ownerSigner: SignerWithAddress;
  let otherSigner: SignerWithAddress;

  before(async () => {
    [ownerSigner, userSigner, otherSigner] = await HRE.ethers.getSigners();
  });

  describe('ENS: Register domain, set owners, set lookup and reverse lookup, create subdomain', async () => {
    const label = 'dhadrien';
    const labelhash = getLabelhash(label);
    const domain = `${label}.eth`;
    const node = nameHash.hash(domain);

    let registrar: EthRegistrar;
    let reverseRegistrar: ReverseRegistrar;
    let registry: ENSRegistry;
    let publicResolver: PublicResolver;
    let ens: ENS;

    before(async () => {
      const deployedENS: FullDeploiementResult = await HRE.run(
        'deploy-ens-full'
      );
      ({ registrar, registry, reverseRegistrar, publicResolver } = deployedENS);

      ens = await new ENS({
        provider: HRE.ethers.provider,
        ensAddress: registry.address,
      });
    });

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
      expect(await ens.name(domain).getAddress()).to.be.equal(
        userSigner.address
      );
    });
    it('user registers iam.dhadrien.eth', async () => {
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
      // setting the resolver in the record: now dhadrien.eth uses publicResolver to resolve
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
      expect(
        await publicResolver.functions['addr(bytes32)'](subNode)
      ).to.be.eql([userSigner.address]);
      // checking with lib
      expect(await ens.name(subDomain).getAddress()).to.be.equal(
        userSigner.address
      );
    });
  });

  describe('ENS: NameWrapper', async () => {
    const label = 'sismo';
    const labelhash = getLabelhash(label);
    const domain = `${label}.eth`;

    let registrar: EthRegistrar;
    let registry: ENSRegistry;
    let publicResolver: PublicResolver;
    let nameWrapper: NameWrapper;
    let ens: ENS;

    before(async () => {
      const deployedENS: FullDeploiementResult = await HRE.run(
        'deploy-ens-full'
      );
      ({ registrar, registry, nameWrapper, publicResolver } = deployedENS);

      ens = await new ENS({
        provider: HRE.ethers.provider,
        ensAddress: registry.address,
      });
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

  describe('ENS DAO: Create a registrar for yourdomain.eth and let user register user.yourdomain.eth freely', async () => {
    const sismoLabel = 'sismo';

    let registrar: EthRegistrar;
    let reverseRegistrar: ReverseRegistrar;
    let registry: ENSRegistry;
    let publicResolver: PublicResolver;
    let nameWrapper: NameWrapper;
    let ensDaoToken: ENSDaoToken;
    let ensDaoRegistrar: ENSDaoRegistrar;
    let ens: ENS;

    before(async () => {
      const deployedENS: FullDeploiementResult = await HRE.run(
        'deploy-ens-full'
      );
      ({ registrar, registry, reverseRegistrar, publicResolver, nameWrapper } =
        deployedENS);

      ens = await new ENS({
        provider: HRE.ethers.provider,
        ensAddress: registry.address,
      });
    });

    describe('when a NameWrapper contract is provided', () => {
      const label = 'vitalik';
      const otherLabel = 'dhadrien';

      before(async () => {
        const deployedEnsDao: EnsDeploiementResult = await HRE.run(
          'deploy-ens-dao',
          {
            // name NEEEDS to be label of .eth name
            name: sismoLabel,
            symbol: 'SISMO',
            ens: registry.address,
            resolver: publicResolver.address,
            nameWrapper: nameWrapper.address,
            reverseRegistrar: reverseRegistrar.address,
          }
        );
        ({ ensDaoToken, ensDaoRegistrar } = deployedEnsDao);
      });

      it('sismo.eth owner wrap and gives wrapped ownership to sismo.eth ENS DAO', async () => {
        const sismoTokenId = ethers.BigNumber.from(
          getLabelhash(sismoLabel)
        ).toString();
        await registry.setApprovalForAll(nameWrapper.address, true);
        await registrar.approve(nameWrapper.address, sismoTokenId);
        await nameWrapper
          .connect(ownerSigner)
          .wrapETH2LD(
            sismoLabel,
            ensDaoRegistrar.address,
            0,
            publicResolver.address
          );
      });
      it(`not owners of ${label}.eth / ${otherLabel}.eth cannot register ${label}.${sismoLabel}.eth / ${otherLabel}.${sismoLabel}.eth`, async () => {
        await registrar.register(
          getLabelhash(label),
          ownerSigner.address,
          year
        );

        await expect(
          ensDaoRegistrar.connect(otherSigner).register(label)
        ).to.be.revertedWith(
          'ENS_DAO_REGISTRAR: subdomain reserved for .eth holder during reservation period'
        );
        // registered in previous test, owner is userSigner
        await expect(
          ensDaoRegistrar.connect(otherSigner).register(otherLabel)
        ).to.be.revertedWith(
          'ENS_DAO_REGISTRAR: subdomain reserved for .eth holder during reservation period'
        );
      });
      it(`not owner of ${label}.eth can register ${label}.${sismoLabel}.eth after 1 week`, async () => {
        // 1 week  + 5 sec
        await increaseTime(
          HRE,
          (await ensDaoRegistrar.RESERVATION_PERIOD()).toNumber() + 5
        );
        const domain = `${label}.${sismoLabel}.eth`;
        const userNode = nameHash.hash(domain);

        const tx = await ensDaoRegistrar.connect(otherSigner).register(label);
        const receipt = await tx.wait();

        const nameRegisteredEvent = receipt.events?.find(
          (e) =>
            e.event === 'NameRegistered' &&
            e.address === ensDaoRegistrar.address
        );
        expect(nameRegisteredEvent?.args?.owner).to.equal(otherSigner.address);
        expect(nameRegisteredEvent?.args?.id.toHexString()).to.equal(userNode);

        expect(await ens.name(domain).getAddress()).to.be.equal(
          otherSigner.address
        );
      });
      it(`owner of ${otherLabel}.eth can register ${otherLabel}.${sismoLabel}.eth, get the wrapped subdomain`, async () => {
        const domain = `${otherLabel}.${sismoLabel}.eth`;
        const userNode = nameHash.hash(domain);

        const tx = await ensDaoRegistrar
          .connect(userSigner)
          .register(otherLabel);
        const receipt = await tx.wait();

        const nameRegisteredEvent = receipt.events?.find(
          (e) =>
            e.event === 'NameRegistered' &&
            e.address === ensDaoRegistrar.address
        );
        expect(nameRegisteredEvent?.args?.owner).to.equal(userSigner.address);
        expect(nameRegisteredEvent?.args?.id.toHexString()).to.equal(userNode);

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
        ).to.be.revertedWith('ENS_DAO_REGISTRAR: too many subdomains');
      });

      it('User cannot gen an already registered subdomain', async () => {
        await expect(
          ensDaoRegistrar.connect(otherSigner).register(label)
        ).to.be.revertedWith('ENS_DAO_REGISTRAR: subdomain already registered');
      });

      it('User should be able to unwrap', async () => {
        const labelHash = getLabelhash(otherLabel);
        const parentNode = nameHash.hash(`${sismoLabel}.eth`);
        const domain = `${otherLabel}.${sismoLabel}.eth`;
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
        await expect(
          ensDaoRegistrar.connect(userSigner).giveBackDomainOwnership()
        ).to.be.revertedWith('Ownable: caller is not the owner');
        const tx = await ensDaoRegistrar
          .connect(ownerSigner)
          .giveBackDomainOwnership();
        const receipt = await tx.wait();

        const ownershipConcedEvent = receipt.events?.find(
          (e) =>
            e.event === 'OwnershipConceded' &&
            e.address === ensDaoRegistrar.address
        );
        expect(ownershipConcedEvent?.args?.owner).to.equal(ownerSigner.address);

        expect(await registrar.balanceOf(ownerSigner.address)).to.be.equal(
          ethEnsBalanceBefore.add(1)
        );
      });
      it(`Owner can delete the subdomain ${otherLabel}.${sismoLabel}.eth`, async () => {
        const domain = `${otherLabel}.${sismoLabel}.eth`;

        await ens.name(`${sismoLabel}.eth`).deleteSubdomain(otherLabel);

        expect(await ens.name(domain).getAddress()).to.be.equal(
          ethers.constants.AddressZero
        );
        expect(await ens.name(domain).getOwner()).to.be.equal(
          ethers.constants.AddressZero
        );
      });
    });

    describe('when a NameWrapper contract is not provided and ENS registry is used', () => {
      before(async () => {
        const deployedEnsDao: EnsDeploiementResult = await HRE.run(
          'deploy-ens-dao',
          {
            // name NEEEDS to be label of .eth name
            name: sismoLabel,
            symbol: 'SISMO',
            ens: registry.address,
            resolver: publicResolver.address,
            nameWrapper: ethers.constants.AddressZero,
            reverseRegistrar: reverseRegistrar.address,
          }
        );
        ({ ensDaoToken, ensDaoRegistrar } = deployedEnsDao);
        [ownerSigner, , , userSigner, otherSigner] =
          await HRE.ethers.getSigners();
      });

      const label = 'vitalikbuddy';
      const otherLabel = 'dhadrienbuddy';

      it('sismo.eth owner gives ownership of sismo.eth to ENS DAO', async () => {
        await ens.name(`${sismoLabel}.eth`).setOwner(ensDaoRegistrar.address);
        expect(await ens.name(`${sismoLabel}.eth`).getOwner()).to.be.equal(
          ensDaoRegistrar.address
        );
      });

      it(`not owner of ${label}.eth can register ${label}.${sismoLabel}.eth`, async () => {
        const domain = `${label}.${sismoLabel}.eth`;
        const node = nameHash.hash(domain);

        const tx = await ensDaoRegistrar.connect(otherSigner).register(label);
        const receipt = await tx.wait();

        const nameRegisteredEvent = receipt.events?.find(
          (e) =>
            e.event === 'NameRegistered' &&
            e.address === ensDaoRegistrar.address
        );
        expect(nameRegisteredEvent?.args?.owner).to.equal(otherSigner.address);
        expect(nameRegisteredEvent?.args?.id.toHexString()).to.equal(node);

        expect(await ens.name(domain).getAddress()).to.be.equal(
          otherSigner.address
        );
        expect(await ensDaoToken.ownerOf(node)).to.be.equal(
          otherSigner.address
        );
      });
      it(`User can register ${otherLabel}.${sismoLabel}.eth`, async () => {
        const domain = `${otherLabel}.${sismoLabel}.eth`;
        const userNode = nameHash.hash(domain);

        const tx = await ensDaoRegistrar
          .connect(userSigner)
          .register(otherLabel);
        const receipt = await tx.wait();

        const nameRegisteredEvent = receipt.events?.find(
          (e) =>
            e.event === 'NameRegistered' &&
            e.address === ensDaoRegistrar.address
        );
        expect(nameRegisteredEvent?.args?.owner).to.equal(userSigner.address);
        expect(nameRegisteredEvent?.args?.id.toHexString()).to.equal(userNode);

        expect(await ens.name(domain).getAddress()).to.be.equal(
          userSigner.address
        );
        expect(await ensDaoToken.ownerOf(userNode)).to.be.equal(
          userSigner.address
        );
      });
      it('User cannot gen an already registered subdomain', async () => {
        await expect(
          ensDaoRegistrar.connect(otherSigner).register(label)
        ).to.be.revertedWith('ENS_DAO_REGISTRAR: subdomain already registered');
      });
      it('User cannot gen another subdomain', async () => {
        await expect(
          ensDaoRegistrar.connect(userSigner).register('dhadrien2')
        ).to.be.revertedWith('ENS_DAO_REGISTRAR: too many subdomains');
      });
      it('Sismo.eth initial owner should be able to get back ownership of the root domain', async () => {
        await expect(
          ensDaoRegistrar.connect(userSigner).giveBackDomainOwnership()
        ).to.be.revertedWith('Ownable: caller is not the owner');

        const tx = await ensDaoRegistrar
          .connect(ownerSigner)
          .giveBackDomainOwnership();
        const receipt = await tx.wait();

        const ownershipConcedEvent = receipt.events?.find(
          (e) =>
            e.event === 'OwnershipConceded' &&
            e.address === ensDaoRegistrar.address
        );
        expect(ownershipConcedEvent?.args?.owner).to.equal(ownerSigner.address);

        expect(await ens.name(`${sismoLabel}.eth`).getOwner()).to.be.equal(
          ownerSigner.address
        );
      });
      it(`Owner can delete the subdomain ${otherLabel}.${sismoLabel}.eth`, async () => {
        const domain = `${otherLabel}.${sismoLabel}.eth`;

        await ens.name(`${sismoLabel}.eth`).deleteSubdomain(otherLabel);

        expect(await ens.name(domain).getAddress()).to.be.equal(
          ethers.constants.AddressZero
        );
        expect(await ens.name(domain).getOwner()).to.be.equal(
          ethers.constants.AddressZero
        );
      });
    });

    describe('max number of emission limitation', () => {
      before(async () => {
        const deployedEnsDao: EnsDeploiementResult = await HRE.run(
          'deploy-ens-dao',
          {
            // name NEEEDS to be label of .eth name
            name: sismoLabel,
            symbol: 'SISMO',
            ens: registry.address,
            resolver: publicResolver.address,
            nameWrapper: ethers.constants.AddressZero,
            reverseRegistrar: reverseRegistrar.address,
          }
        );
        ({ ensDaoToken, ensDaoRegistrar } = deployedEnsDao);
        [ownerSigner, , , , , , userSigner, otherSigner] =
          await HRE.ethers.getSigners();

        await ens.name(`${sismoLabel}.eth`).setOwner(ensDaoRegistrar.address);
      });
      it('User can not register when the emission limitation is reached', async () => {
        const label = 'istanbul';
        await ensDaoRegistrar.register(label);

        const totalSupply = await ensDaoToken.totalSupply();

        const tx = await ensDaoRegistrar.updateMaxEmissionNumber(
          totalSupply.toString()
        );
        const receipt = await tx.wait();

        const maxEmissionNumberUpdatedEvent = receipt.events?.find(
          (e) =>
            e.event === 'MaxEmissionNumberUpdated' &&
            e?.args?.maxEmissionNumber.toString() === totalSupply.toString()
        );
        expect(Boolean(maxEmissionNumberUpdatedEvent)).to.equal(true);

        expect(ensDaoRegistrar.register(label)).to.be.revertedWith(
          'ENS_DAO_REGISTRAR: too many emissions'
        );
      });
    });
  });
});
