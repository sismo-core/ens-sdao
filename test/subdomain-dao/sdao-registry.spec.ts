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
  SDaoRegistrar,
} from '../../types';
import { expectEvent, evmSnapshot, evmRevert } from '../helpers';
import { DeployedSDao, DeployedEns } from '../../tasks';

describe('SDAO Registrar', () => {
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
  let sDaoRegistrar: SDaoRegistrar;
  let ens: ENS;

  let ownerSigner: SignerWithAddress;
  let signer1: SignerWithAddress;
  let signer2: SignerWithAddress;

  let snapshotId: string;

  before(async () => {
    const deployedENS: DeployedEns = await HRE.run('deploy-ens-full', {
      deploymentName: 'ENS_SDAO_REGISTRAR_TEST_SUITE',
    });
    ({ registry, reverseRegistrar, publicResolver, registrar } = deployedENS);

    const deployedSDao: DeployedSDao = await HRE.run('deploy-sdao', {
      name: sismoLabel,
      symbol: 'SISMO',
      ens: registry.address,
      resolver: publicResolver.address,
      reverseRegistrar: reverseRegistrar.address,
    });
    ({ sDaoRegistrar } = deployedSDao);

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
    await ens.name(`${sismoLabel}.eth`).setOwner(sDaoRegistrar.address);

    snapshotId = await evmSnapshot(HRE);
  });

  afterEach(async () => {
    await evmRevert(HRE, snapshotId);
    snapshotId = await evmSnapshot(HRE);
  });

  it(`user can register any <domain>.${sismoLabel}.eth`, async () => {
    const tx = await sDaoRegistrar.connect(signer2).register(label);
    expectEvent(
      await tx.wait(),
      'NameRegistered',
      (args) =>
        args.owner === signer2.address &&
        args.label === label &&
        args.registrant === signer2.address
    );
    expect(await ens.name(domain).getAddress()).to.be.equal(signer2.address);
  });

  it(`user can not register an already registered subdomain`, async () => {
    await sDaoRegistrar.connect(signer1).register(label);

    await expect(
      sDaoRegistrar.connect(signer2).register(label)
    ).to.be.revertedWith('SDAO_REGISTRAR: SUBDOMAIN_ALREADY_REGISTERED');
  });

  it(`owner of the contract may register multiple subdomains`, async () => {
    const otherLabel = 'second';
    const otherDomain = `${otherLabel}.${sismoLabel}.eth`;

    await sDaoRegistrar.register(label);
    await sDaoRegistrar.register(otherLabel);

    expect(await ens.name(domain).getAddress()).to.be.equal(
      ownerSigner.address
    );

    expect(await ens.name(otherDomain).getAddress()).to.be.equal(
      ownerSigner.address
    );
  });

  describe('restricted access', () => {
    it('owner can restrict access to registration', async () => {
      const tx = await sDaoRegistrar.restrictRegistration();

      expect(await sDaoRegistrar._restricted()).to.equal(true);

      expectEvent(await tx.wait(), 'Restricted', () => true);

      await expect(
        sDaoRegistrar.connect(signer2).register(label)
      ).to.be.revertedWith('SDAO_REGISTRAR: RESTRICTED_REGISTRATION');
    });

    it('owner can open access to registration', async () => {
      await sDaoRegistrar.restrictRegistration();
      const tx = await sDaoRegistrar.openRegistration();

      expect(await sDaoRegistrar._restricted()).to.equal(false);

      expectEvent(await tx.wait(), 'Unrestricted', () => true);

      await sDaoRegistrar.connect(signer2).register(label);

      expect(await ens.name(domain).getAddress()).to.be.equal(signer2.address);
    });

    it('user can not restrict access', async () => {
      await expect(
        sDaoRegistrar.connect(signer2).restrictRegistration()
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });
  });

  describe('root domain ownership', () => {
    it('user can not take back the root domain ownership if not owner', async () => {
      await expect(
        sDaoRegistrar
          .connect(signer1)
          .transferDomainOwnership(ownerSigner.address)
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('owner can take back the root domain ownership', async () => {
      const tx = await sDaoRegistrar.transferDomainOwnership(
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
