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
  ENSDaoRegistrarPresetClaimable,
  ENSLabelBooker,
} from '../types';
import { expectEvent, evmSnapshot, evmRevert } from './helpers';
import { DeployedEns, DeployedEnsDaoClaimable } from '../tasks';

describe('ENS DAO Registrar - Claimbale Preset', () => {
  const getLabelhash = (label: string) =>
    ethers.utils.keccak256(ethers.utils.toUtf8Bytes(label));
  const year = 365 * 24 * 60 * 60;
  const sismoLabel = 'sismo';

  const label = 'first';
  const domain = `${label}.${sismoLabel}.eth`;
  const node = nameHash.hash(domain);

  let registrar: EthRegistrar;
  let reverseRegistrar: ReverseRegistrar;
  let registry: ENSRegistry;
  let publicResolver: PublicResolver;
  let ensDaoRegistrar: ENSDaoRegistrarPresetClaimable;
  let ens: ENS;
  let ensLabelBooker: ENSLabelBooker;

  let ownerSigner: SignerWithAddress;
  let signer1: SignerWithAddress;
  let signer2: SignerWithAddress;

  let snapshotId: string;

  before(async () => {
    const deployedENS: DeployedEns = await HRE.run('deploy-ens-full');
    ({ registry, reverseRegistrar, publicResolver, registrar } = deployedENS);

    const deployedEnsDao: DeployedEnsDaoClaimable = await HRE.run(
      'deploy-ens-dao-claimable',
      {
        name: sismoLabel,
        ens: registry.address,
        resolver: publicResolver.address,
        reverseRegistrar: reverseRegistrar.address,
      }
    );
    ({ ensDaoRegistrar, ensLabelBooker } = deployedEnsDao);

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

  describe('booking and claim', () => {
    beforeEach(async () => {
      await ensLabelBooker.book(getLabelhash(label), signer1.address);
    });

    it(`user can claim the label if it is the proper booking address`, async () => {
      const tx = await ensDaoRegistrar
        .connect(signer1)
        .claim(label, signer1.address);
      expectEvent(
        await tx.wait(),
        'NameRegistered',
        (args) =>
          args.owner === signer1.address && args.id.toHexString() === node
      );
      expect(await ens.name(domain).getAddress()).to.be.equal(signer1.address);
    });

    it(`owner can claim the label and send it to an arbitrary address if it is the proper booking address`, async () => {
      const tx = await ensDaoRegistrar.claim(label, signer2.address);

      const receipt = await tx.wait();
      expectEvent(
        receipt,
        'NameRegistered',
        (args) =>
          args.owner === signer2.address && args.id.toHexString() === node
      );
      expectEvent(
        receipt,
        'BookingDeleted',
        (args) =>
          args.id.toHexString() === nameHash.hash(`${label}.${sismoLabel}.eth`)
      );
      expect(await ens.name(domain).getAddress()).to.be.equal(signer2.address);

      expect(await ensLabelBooker.getBooking(getLabelhash(label))).to.be.equal(
        ethers.constants.AddressZero
      );
    });

    it(`user can not claim the label if it is not the proper booking address`, async () => {
      await expect(
        ensDaoRegistrar.connect(signer2).claim(label, signer2.address)
      ).to.be.revertedWith('ENS_DAO_REGISTRAR_CLAIMABLE: SENDER_NOT_ALLOWED');
    });

    it(`user can not claim the label if it is not booked`, async () => {
      const otherLabel = 'second';
      await expect(
        ensDaoRegistrar.connect(signer2).claim(otherLabel, signer2.address)
      ).to.be.revertedWith('ENS_DAO_REGISTRAR_CLAIMABLE: LABEL_NOT_BOOKED');
    });

    it(`user can not register the label if it is booked`, async () => {
      await expect(
        ensDaoRegistrar.connect(signer1).register(label)
      ).to.be.revertedWith('ENS_DAO_REGISTRAR_CLAIMABLE: LABEL_BOOKED');
    });
  });
});
