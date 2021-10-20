import { expect } from 'chai';
//@ts-ignore
import ENS from '@ensdomains/ensjs';
import HRE, { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import {
  ENSRegistry,
  ReverseRegistrar,
  PublicResolver,
  ENSDaoRegistrar,
  ENSLabelBooker,
} from '../types';
//@ts-ignore
import nameHash from 'eth-ens-namehash';
import { expectEvent, evmSnapshot, evmRevert } from './helpers';
import { DeployedEnsDao, DeployedEns } from '../tasks';

describe('ENS Label Booker', () => {
  let otherSigner: SignerWithAddress;

  const sismoLabel = 'sismo';

  let reverseRegistrar: ReverseRegistrar;
  let registry: ENSRegistry;
  let publicResolver: PublicResolver;
  let ensDaoRegistrar: ENSDaoRegistrar;
  let ensDaoLabelBooker: ENSLabelBooker;

  let snapshotId: string;

  before(async () => {
    const deployedENS: DeployedEns = await HRE.run('deploy-ens-full');
    ({ registry, reverseRegistrar, publicResolver } = deployedENS);

    const deployedEnsDao: DeployedEnsDao = await HRE.run('deploy-ens-dao', {
      name: sismoLabel,
      symbol: 'SISMO',
      ens: registry.address,
      resolver: publicResolver.address,
      nameWrapper: ethers.constants.AddressZero,
      reverseRegistrar: reverseRegistrar.address,
    });
    ({ ensDaoLabelBooker, ensDaoRegistrar } = deployedEnsDao);
    [, otherSigner] = await HRE.ethers.getSigners();

    snapshotId = await evmSnapshot(HRE);
  });

  afterEach(async () => {
    await evmRevert(HRE, snapshotId);
    snapshotId = await evmSnapshot(HRE);
  });

  const label0 = 'testlabel';
  const label1 = 'anotherlabel';
  const label2 = 'yetanotherlabel';
  const labels = [label0, label1, label2];

  const domain0 = `${label0}.${sismoLabel}.eth`;
  const userNode0 = nameHash.hash(domain0);

  const nodes = labels.map((label) =>
    nameHash.hash(`${label}.${sismoLabel}.eth`)
  );

  it(`Owner can book a label`, async () => {
    const tx = await ensDaoLabelBooker.book(label0, ensDaoRegistrar.address);
    const receipt = await tx.wait();

    expectEvent(
      receipt,
      'NameBooked',
      (args) =>
        args.id.toHexString() === userNode0 &&
        args.bookingAddress === ensDaoRegistrar.address
    );

    expect(await ensDaoLabelBooker.getBooking(label0)).to.equal(
      ensDaoRegistrar.address
    );
  });

  it(`Owner can not book an already booked label`, async () => {
    await ensDaoLabelBooker.book(label0, ensDaoRegistrar.address);
    await expect(
      ensDaoLabelBooker.book(label0, ensDaoRegistrar.address)
    ).to.be.revertedWith('ENS_LABEL_BOOKER: LABEL_ALREADY_BOOKED');
  });

  it(`Owner can not book with a zero address`, async () => {
    await expect(
      ensDaoLabelBooker.book(label0, ethers.constants.AddressZero)
    ).to.be.revertedWith('ENS_LABEL_BOOKER: INVALID_BOOKING_ADDRESS');
  });

  it(`Owner can book multiple labels by batch`, async () => {
    const tx = await ensDaoLabelBooker.batchBook(labels, [
      ensDaoRegistrar.address,
      ensDaoRegistrar.address,
      ensDaoRegistrar.address,
    ]);
    const receipt = await tx.wait();

    expectEvent(
      receipt,
      'NameBooked',
      (args) =>
        args.bookingAddress === ensDaoRegistrar.address &&
        args.id.toHexString() === nodes[0]
    );
    expectEvent(
      receipt,
      'NameBooked',
      (args) =>
        args.bookingAddress === ensDaoRegistrar.address &&
        args.id.toHexString() === nodes[1]
    );
    expectEvent(
      receipt,
      'NameBooked',
      (args) =>
        args.bookingAddress === ensDaoRegistrar.address &&
        args.id.toHexString() === nodes[2]
    );

    expect(await ensDaoLabelBooker.getBooking(labels[0])).to.equal(
      ensDaoRegistrar.address
    );
    expect(await ensDaoLabelBooker.getBooking(labels[1])).to.equal(
      ensDaoRegistrar.address
    );
    expect(await ensDaoLabelBooker.getBooking(labels[2])).to.equal(
      ensDaoRegistrar.address
    );
  });

  it(`Owner can update a booking`, async () => {
    await ensDaoLabelBooker.book(label0, ensDaoRegistrar.address);
    const tx = await ensDaoLabelBooker.updateBooking(
      label0,
      otherSigner.address
    );
    expectEvent(
      await tx.wait(),
      'BookingUpdated',
      (args) =>
        args.bookingAddress === otherSigner.address &&
        args.id.toHexString() === userNode0
    );
    expect(await ensDaoLabelBooker.getBooking(label0)).to.equal(
      otherSigner.address
    );
  });

  it(`Owner can update bookings by batch`, async () => {
    await ensDaoLabelBooker.batchBook(labels, [
      ensDaoRegistrar.address,
      ensDaoRegistrar.address,
      ensDaoRegistrar.address,
    ]);
    const tx = await ensDaoLabelBooker.batchUpdateBooking(labels, [
      otherSigner.address,
      otherSigner.address,
      otherSigner.address,
    ]);
    const receipt = await tx.wait();
    expectEvent(
      receipt,
      'BookingUpdated',
      (args) =>
        args.bookingAddress === otherSigner.address &&
        args.id.toHexString() === nodes[0]
    );
    expectEvent(
      receipt,
      'BookingUpdated',
      (args) =>
        args.bookingAddress === otherSigner.address &&
        args.id.toHexString() === nodes[1]
    );
    expectEvent(
      receipt,
      'BookingUpdated',
      (args) =>
        args.bookingAddress === otherSigner.address &&
        args.id.toHexString() === nodes[2]
    );

    expect(await ensDaoLabelBooker.getBooking(labels[0])).to.equal(
      otherSigner.address
    );
    expect(await ensDaoLabelBooker.getBooking(labels[1])).to.equal(
      otherSigner.address
    );
    expect(await ensDaoLabelBooker.getBooking(labels[2])).to.equal(
      otherSigner.address
    );
  });

  it(`Owner can delete a booking`, async () => {
    await ensDaoLabelBooker.book(label0, ensDaoRegistrar.address);
    const tx = await ensDaoLabelBooker.deleteBooking(label0);
    expectEvent(
      await tx.wait(),
      'BookingDeleted',
      (args) => args.id.toHexString() === userNode0
    );
    expect(await ensDaoLabelBooker.getBooking(label0)).to.equal(
      ethers.constants.AddressZero
    );
  });
  it(`Owner can delete bookings by batch`, async () => {
    await ensDaoLabelBooker.batchBook(labels, [
      ensDaoRegistrar.address,
      ensDaoRegistrar.address,
      ensDaoRegistrar.address,
    ]);
    const tx = await ensDaoLabelBooker.batchDeleteBooking(labels);
    const receipt = await tx.wait();
    expectEvent(
      receipt,
      'BookingUpdated',
      (args) => args.id.toHexString() === nodes[0]
    );
    expectEvent(
      receipt,
      'BookingUpdated',
      (args) => args.id.toHexString() === nodes[1]
    );
    expectEvent(
      receipt,
      'BookingUpdated',
      (args) => args.id.toHexString() === nodes[2]
    );
  });
});
