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
  SDaoRegistrarPresetERC1155,
} from '../../types';
import { increaseTime, expectEvent, evmSnapshot, evmRevert } from '../helpers';
import { DeployedEns, DeployedSDaoPresetERC1155 } from '../../tasks';

describe('SDAO Registrar - Reserved Limited', () => {
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
  let sDaoRegistrar: SDaoRegistrarPresetERC1155;
  let ens: ENS;

  let ownerSigner: SignerWithAddress;
  let signer1: SignerWithAddress;
  let signer2: SignerWithAddress;

  let snapshotId: string;

  before(async () => {
    const deployedENS: DeployedEns = await HRE.run('deploy-ens-full', {
      deploymentName: 'ENS_RESERVED_LIMITED_EXTENSION_TEST_SUITE',
    });
    ({ registry, reverseRegistrar, publicResolver, registrar } = deployedENS);

    const deployedSDao: DeployedSDaoPresetERC1155 = await HRE.run(
      'deploy-sdao-preset-erc721',
      {
        name: sismoLabel,
        symbol: 'SISMO',
        ens: registry.address,
        resolver: publicResolver.address,
        reverseRegistrar: reverseRegistrar.address,
      }
    );
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

  describe('when the reservation period is not over', () => {
    it(`user can register a <domain>.${sismoLabel}.eth if <domain>.eth is owned by same account`, async () => {
      await registrar.register(getLabelhash(label), signer1.address, year);

      const tx = await sDaoRegistrar.connect(signer1).register(label);
      expectEvent(
        await tx.wait(),
        'NameRegistered',
        (args) =>
          args.owner === signer1.address &&
          args.id.toHexString() === node &&
          args.label === label &&
          args.registrant === signer1.address
      );
      expect(await ens.name(domain).getAddress()).to.be.equal(signer1.address);
    });
    it(`user can register a <domain>.${sismoLabel}.eth if <domain>.eth is free`, async () => {
      const tx = await sDaoRegistrar.connect(signer1).register(label);
      expectEvent(
        await tx.wait(),
        'NameRegistered',
        (args) =>
          args.owner === signer1.address &&
          args.id.toHexString() === node &&
          args.label === label &&
          args.registrant === signer1.address
      );
      expect(await ens.name(domain).getAddress()).to.be.equal(signer1.address);
    });

    it(`user can not register a <domain>.${sismoLabel}.eth if <domain>.eth is owned by another address`, async () => {
      await registrar.register(getLabelhash(label), signer1.address, year);
      await expect(
        sDaoRegistrar.connect(signer2).register(label)
      ).to.be.revertedWith('SDAO_REGISTRAR_RESERVED: SUBDOMAIN_RESERVED');
    });
  });

  describe('when the reservation is over', () => {
    beforeEach(async () => {
      const reservationDuration = await sDaoRegistrar._reservationDuration();
      await increaseTime(HRE, reservationDuration.toNumber() + 5);
    });

    it(`user can register any <domain>.${sismoLabel}.eth`, async () => {
      await registrar.register(getLabelhash(label), signer1.address, year);

      const tx = await sDaoRegistrar.connect(signer2).register(label);
      expectEvent(
        await tx.wait(),
        'NameRegistered',
        (args) =>
          args.owner === signer2.address &&
          args.id.toHexString() === node &&
          args.label === label &&
          args.registrant === signer2.address
      );
      expect(await ens.name(domain).getAddress()).to.be.equal(signer2.address);
    });
  });

  describe('registration limit', () => {
    it('user can not register once the registration limit is reached', async () => {
      const otherLabel = 'second';
      await sDaoRegistrar.connect(signer1).register(label);

      const registrationNumber = await sDaoRegistrar._counter();
      const tx = await sDaoRegistrar.updateRegistrationLimit(
        registrationNumber.toString()
      );

      const receipt = await tx.wait();

      expectEvent(
        receipt,
        'RegistrationLimitUpdated',
        (args) =>
          args.registrationLimit.toString() === registrationNumber.toString()
      );

      await expect(sDaoRegistrar.register(otherLabel)).to.be.revertedWith(
        'SDAO_REGISTRAR_LIMITED: REGISTRATION_LIMIT_REACHED'
      );
    });

    it('user can not update the registration limit if not owner', async () => {
      await expect(
        sDaoRegistrar.connect(signer1).updateRegistrationLimit('100')
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('owner can not decrease the registration limit lower than the current number of emissions', async () => {
      await sDaoRegistrar.connect(signer1).register(label);
      await expect(
        sDaoRegistrar.updateRegistrationLimit(
          (await sDaoRegistrar._counter()).sub(1).toString()
        )
      ).to.be.revertedWith(
        'SDAO_REGISTRAR_LIMITED: NEW_REGISTRATION_LIMIT_TOO_LOW'
      );
    });
  });
});
