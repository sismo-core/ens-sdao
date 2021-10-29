import { expect } from 'chai';
//@ts-ignore
import ENS from '@ensdomains/ensjs';
import HRE, { ethers } from 'hardhat';
//@ts-ignore
import nameHash from 'eth-ens-namehash';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import {
  ENSRegistry,
  EthRegistrar,
  ReverseRegistrar,
  PublicResolver,
  ENSDaoRegistrar,
} from '../../types';
import { expectEvent, evmSnapshot, evmRevert } from '../helpers';
import { DeployedEnsDao, DeployedEns } from '../../tasks';

describe('ENS DAO Registrar', () => {
  const utils = ethers.utils;
  const year = 365 * 24 * 60 * 60;
  const sismoLabel = 'sismo';

  const label = 'first';
  const domain = `${label}.${sismoLabel}.eth`;
  const node = nameHash.hash(domain);

  const getLabelhash = (label: string) =>
    utils.keccak256(utils.toUtf8Bytes(label));

  let registrar: EthRegistrar;
  let reverseRegistrar: ReverseRegistrar;
  let registry: ENSRegistry;
  let publicResolver: PublicResolver;
  let ensDaoRegistrar: ENSDaoRegistrar;
  let ens: ENS;

  let ownerSigner: SignerWithAddress;
  let signer1: SignerWithAddress;
  let signer2: SignerWithAddress;

  let snapshotId: string;

  before(async () => {
    const deployedENS: DeployedEns = await HRE.run('deploy-ens-full');
    ({ registry, reverseRegistrar, publicResolver, registrar } = deployedENS);

    const deployedEnsDao: DeployedEnsDao = await HRE.run('deploy-ens-dao', {
      name: sismoLabel,
      symbol: 'SISMO',
      ens: registry.address,
      resolver: publicResolver.address,
      reverseRegistrar: reverseRegistrar.address,
    });
    ({ ensDaoRegistrar } = deployedEnsDao);

    ens = await new ENS({
      provider: HRE.ethers.provider,
      ensAddress: registry.address,
    });

    [ownerSigner, signer1, signer2] = await HRE.ethers.getSigners();

    // The <sismoLabel>.eth is given to the registrar
    await registrar.register(
      getLabelhash(sismoLabel),
      ownerSigner.address,
      year
    );
    await ens.name(`${sismoLabel}.eth`).setOwner(ensDaoRegistrar.address);

    snapshotId = await evmSnapshot(HRE);
  });

  afterEach(async () => {
    await evmRevert(HRE, snapshotId);
    snapshotId = await evmSnapshot(HRE);
  });

  it(`user can register any <domain>.${sismoLabel}.eth`, async () => {
    const tx = await ensDaoRegistrar.connect(signer2).register(label);
    expectEvent(
      await tx.wait(),
      'NameRegistered',
      (args) =>
        args.owner === signer2.address &&
        args.id.toHexString() === node &&
        args.registrant === signer2.address
    );
    expect(await ens.name(domain).getAddress()).to.be.equal(signer2.address);
  });

  it(`user can not register an already registered subdomain`, async () => {
    await ensDaoRegistrar.connect(signer1).register(label);

    await expect(
      ensDaoRegistrar.connect(signer2).register(label)
    ).to.be.revertedWith('ENS_DAO_REGISTRAR: SUBDOMAIN_ALREADY_REGISTERED');
  });

  it(`owner of the contract may register multiple subdomains`, async () => {
    const otherLabel = 'second';
    const otherDomain = `${otherLabel}.${sismoLabel}.eth`;

    await ensDaoRegistrar.register(label);
    await ensDaoRegistrar.register(otherLabel);

    expect(await ens.name(domain).getAddress()).to.be.equal(
      ownerSigner.address
    );

    expect(await ens.name(otherDomain).getAddress()).to.be.equal(
      ownerSigner.address
    );
  });

  describe('restricted access', () => {
    it('owner can restrict access to registration', async () => {
      const tx = await ensDaoRegistrar.restrictRegistration();

      expect(await ensDaoRegistrar._restricted()).to.equal(true);

      expectEvent(await tx.wait(), 'Restricted', () => true);

      await expect(
        ensDaoRegistrar.connect(signer2).register(label)
      ).to.be.revertedWith('ENS_DAO_REGISTRAR: RESTRICTED_REGISTRATION');
    });

    it('owner can open access to registration', async () => {
      await ensDaoRegistrar.restrictRegistration();
      const tx = await ensDaoRegistrar.openRegistration();

      expect(await ensDaoRegistrar._restricted()).to.equal(false);

      expectEvent(await tx.wait(), 'Unrestricted', () => true);

      await ensDaoRegistrar.connect(signer2).register(label);

      expect(await ens.name(domain).getAddress()).to.be.equal(signer2.address);
    });

    it('user can not restrict access', async () => {
      await expect(
        ensDaoRegistrar.connect(signer2).restrictRegistration()
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });
  });

  describe('root domain ownership', () => {
    it('user can not take back the root domain ownership if not owner', async () => {
      await expect(
        ensDaoRegistrar
          .connect(signer1)
          .transferDomainOwnership(ownerSigner.address)
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('owner can take back the root domain ownership', async () => {
      const tx = await ensDaoRegistrar.transferDomainOwnership(
        ownerSigner.address
      );
      expectEvent(
        await tx.wait(),
        'DomainOwnershipTransferred',
        (args) => args.owner === ownerSigner.address
      );

      expect(await ens.name(`${sismoLabel}.eth`).getOwner()).to.be.equal(
        ownerSigner.address
      );
    });
  });
});
