import { expect } from 'chai';
//@ts-ignore
import HRE from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { TicketManager } from '../types';
//@ts-ignore
import { expectEvent, evmSnapshot, evmRevert } from './helpers';
import {
  DeployedTicketManager,
  generateAnonymousTicket,
  TicketWrapper,
} from '../tasks';

describe('Ticket Manager', () => {
  let ownerSigner: SignerWithAddress;
  let auxiliarySigner: SignerWithAddress;

  let ticketManager: TicketManager;

  let snapshotId: string;

  before(async () => {
    const deployedTicketManager: DeployedTicketManager = await HRE.run(
      'deploy-ticket-manager',
      { ticketGroupLimit: 2 }
    );
    ({ ticketManager } = deployedTicketManager);
    [ownerSigner, auxiliarySigner] = await HRE.ethers.getSigners();

    snapshotId = await evmSnapshot(HRE);
  });

  afterEach(async () => {
    await evmRevert(HRE, snapshotId);
    snapshotId = await evmSnapshot(HRE);
  });

  describe('ticket consumption', () => {
    let ticket: TicketWrapper;

    before(async () => {
      ticket = await generateAnonymousTicket(HRE, ownerSigner, groupNonce);
    });

    beforeEach(async () => {
      await ticketManager.setAuxiliary(auxiliarySigner.address);
    });

    const groupNonce = 1;

    it('auxiliary is able to consume a valid ticket', async () => {
      const tx = await ticketManager
        .connect(auxiliarySigner)
        .consumeTicket(groupNonce, ticket.messageWithNonce, ticket.signature);
      expectEvent(
        await tx.wait(),
        'TicketConsumed',
        (args) =>
          args.groupNonce.toNumber() === groupNonce &&
          args.data === ticket.message
      );

      expect(
        await ticketManager.isTicketConsumed(ticket.messageWithNonce)
      ).to.equal(true);
      expect(await ticketManager.consumedNumber(groupNonce)).to.equal(1);
    });
    it('owner is able to consume a valid ticket', async () => {
      const tx = await ticketManager.consumeTicket(
        groupNonce,
        ticket.messageWithNonce,
        ticket.signature
      );
      expectEvent(
        await tx.wait(),
        'TicketConsumed',
        (args) =>
          args.groupNonce.toNumber() === groupNonce &&
          args.data === ticket.message
      );
      expect(
        await ticketManager.isTicketConsumed(ticket.messageWithNonce)
      ).to.equal(true);
      expect(await ticketManager.consumedNumber(groupNonce)).to.equal(1);
    });
    it('owner/auxiliary can not consume a ticket that has already been consumed', async () => {
      await ticketManager.consumeTicket(
        groupNonce,
        ticket.messageWithNonce,
        ticket.signature
      );
      await expect(
        ticketManager.consumeTicket(
          groupNonce,
          ticket.messageWithNonce,
          ticket.signature
        )
      ).to.be.revertedWith('TICKET_MANAGER: TICKET_ALREADY_CONSUMED');
    });
    it('owner/auxiliary can not consume a ticket if the group limit has been reached', async () => {
      const secondTicket = await generateAnonymousTicket(
        HRE,
        ownerSigner,
        groupNonce
      );
      const thirdTicket = await generateAnonymousTicket(
        HRE,
        ownerSigner,
        groupNonce
      );
      await ticketManager.consumeTicket(
        groupNonce,
        ticket.messageWithNonce,
        ticket.signature
      );
      await ticketManager.consumeTicket(
        groupNonce,
        secondTicket.messageWithNonce,
        secondTicket.signature
      );

      expect(
        await ticketManager.isTicketConsumed(ticket.messageWithNonce)
      ).to.equal(true);
      expect(
        await ticketManager.isTicketConsumed(secondTicket.messageWithNonce)
      ).to.equal(true);
      expect(await ticketManager.consumedNumber(groupNonce)).to.equal(2);

      await expect(
        ticketManager.consumeTicket(
          groupNonce,
          thirdTicket.messageWithNonce,
          thirdTicket.signature
        )
      ).to.be.revertedWith('TICKET_MANAGER: TICKET_GROUP_LIMIT_REACHED');
    });
    it('owner/auxiliary can not consume a ticket signed by someone else than the owner', async () => {
      const invalidTicket = await generateAnonymousTicket(
        HRE,
        auxiliarySigner,
        groupNonce
      );

      await expect(
        ticketManager.consumeTicket(
          groupNonce,
          invalidTicket.messageWithNonce,
          invalidTicket.signature
        )
      ).to.be.revertedWith('TICKET_MANAGER: INVALID_TICKET');
    });
  });

  describe('management', () => {
    it('owner can update the ticket group limit', async () => {
      const tx = await ticketManager.updateTicketGroupLimit(10);
      expectEvent(
        await tx.wait(),
        'TicketGroupLimitUpdated',
        (args) => args.newTicketGroupLimit.toNumber() === 10
      );
      const updatedTicketGroupLimit = await ticketManager._ticketGroupLimit();
      expect(updatedTicketGroupLimit.toNumber()).to.equal(10);
    });

    it('owner can set the auxiliary', async () => {
      expect(await ticketManager._auxiliary()).to.equal(
        HRE.ethers.constants.AddressZero
      );
      const tx = await ticketManager.setAuxiliary(auxiliarySigner.address);
      expectEvent(
        await tx.wait(),
        'AuxiliarySet',
        (args) => args.auxiliary === auxiliarySigner.address
      );
      expect(await ticketManager._auxiliary()).to.equal(
        auxiliarySigner.address
      );
    });

    it('user can not update the ticket group limit if not owner', async () => {
      await expect(
        ticketManager.connect(auxiliarySigner).updateTicketGroupLimit(10)
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });
    it('user can not set the auxiliary if not owner', async () => {
      await expect(
        ticketManager
          .connect(auxiliarySigner)
          .setAuxiliary(auxiliarySigner.address)
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });
  });
});
