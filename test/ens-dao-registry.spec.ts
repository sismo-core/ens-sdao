import { expect } from 'chai';
//@ts-ignore
import ENS from '@ensdomains/ensjs';
import HRE, { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import {
  ENSRegistry,
  EthRegistrar,
  ReverseRegistrar,
  PublicResolver,
  ENSDaoRegistrar,
  ENSDaoToken,
} from '../types';
//@ts-ignore
import nameHash from 'eth-ens-namehash';
import { increaseTime, expectEvent, evmSnapshot, evmRevert } from './helpers';
import {
  DeployedEnsDao,
  DeployedEns,
  generateAnonymousTicket,
  generateNamedTicket,
  getDailyNonceGroup,
  TicketWrapper,
} from '../tasks';

describe('ENS DAO Registrar - Without Name Wrapper', () => {
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
  let ensDaoToken: ENSDaoToken;
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
      nameWrapper: ethers.constants.AddressZero,
      reverseRegistrar: reverseRegistrar.address,
      ticketGroupLimit: 2,
    });
    ({ ensDaoToken, ensDaoRegistrar } = deployedEnsDao);

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

  describe('when the reservation period is not over', () => {
    it(`user can register a <domain>.${sismoLabel}.eth if <domain>.eth is owned by same account`, async () => {
      await registrar.register(getLabelhash(label), signer1.address, year);

      const tx = await ensDaoRegistrar.connect(signer1).register(label);
      expectEvent(
        await tx.wait(),
        'NameRegistered',
        (args) =>
          args.owner === signer1.address && args.id.toHexString() === node
      );
      expect(await ens.name(domain).getAddress()).to.be.equal(signer1.address);
      expect(await ensDaoToken.ownerOf(node)).to.be.equal(signer1.address);
    });
    it(`user can register a <domain>.${sismoLabel}.eth if <domain>.eth is free`, async () => {
      const tx = await ensDaoRegistrar.connect(signer1).register(label);
      expectEvent(
        await tx.wait(),
        'NameRegistered',
        (args) =>
          args.owner === signer1.address && args.id.toHexString() === node
      );
      expect(await ens.name(domain).getAddress()).to.be.equal(signer1.address);
      expect(await ensDaoToken.ownerOf(node)).to.be.equal(signer1.address);
    });

    it(`user can not register a <domain>.${sismoLabel}.eth if <domain>.eth is owned by another address`, async () => {
      await registrar.register(getLabelhash(label), signer1.address, year);
      await expect(
        ensDaoRegistrar.connect(signer2).register(label)
      ).to.be.revertedWith('ENS_DAO_REGISTRAR: SUBDOMAIN_RESERVED');
    });
  });

  describe('when the reservation is over', () => {
    beforeEach(async () => {
      const reservationDuration = await ensDaoRegistrar.RESERVATION_DURATION();
      await increaseTime(HRE, reservationDuration.toNumber() + 5);
    });

    it(`user can register any <domain>.${sismoLabel}.eth`, async () => {
      await registrar.register(getLabelhash(label), signer1.address, year);

      const tx = await ensDaoRegistrar.connect(signer2).register(label);
      expectEvent(
        await tx.wait(),
        'NameRegistered',
        (args) =>
          args.owner === signer2.address && args.id.toHexString() === node
      );
      expect(await ens.name(domain).getAddress()).to.be.equal(signer2.address);
      expect(await ensDaoToken.ownerOf(node)).to.be.equal(signer2.address);
    });
  });

  it(`user can not register an already registered subdomain`, async () => {
    await ensDaoRegistrar.connect(signer1).register(label);

    await expect(
      ensDaoRegistrar.connect(signer2).register(label)
    ).to.be.revertedWith('ENS_DAO_REGISTRAR: SUBDOMAIN_ALREADY_REGISTERED');
  });

  it(`user can not register if owner of a DAO token`, async () => {
    const otherLabel = 'second';
    await ensDaoRegistrar.connect(signer1).register(label);
    await expect(
      ensDaoRegistrar.connect(signer1).register(otherLabel)
    ).to.be.revertedWith('ENS_DAO_REGISTRAR: TOO_MANY_SUBDOMAINS');
  });

  it(`owner of the contract may register multiple subdomains`, async () => {
    const otherLabel = 'second';
    const otherDomain = `${otherLabel}.${sismoLabel}.eth`;
    const otherNode = nameHash.hash(otherDomain);

    await ensDaoRegistrar.register(label);
    await ensDaoRegistrar.register(otherLabel);

    expect(await ens.name(domain).getAddress()).to.be.equal(
      ownerSigner.address
    );
    expect(await ensDaoToken.ownerOf(node)).to.be.equal(ownerSigner.address);

    expect(await ens.name(otherDomain).getAddress()).to.be.equal(
      ownerSigner.address
    );
    expect(await ensDaoToken.ownerOf(otherNode)).to.be.equal(
      ownerSigner.address
    );
  });

  describe('registration with tickets', () => {
    describe('with named tickets', () => {
      let namedTicket: TicketWrapper;

      beforeEach(async () => {
        const nonceGroup = await getDailyNonceGroup(HRE);
        namedTicket = await generateNamedTicket(
          HRE,
          ownerSigner,
          signer1.address,
          nonceGroup
        );
      });

      it('user can register if it is the expected address', async () => {
        const tx = await ensDaoRegistrar
          .connect(signer1)
          .registerWithNamedTicket(label, namedTicket.ticket);
        expectEvent(
          await tx.wait(),
          'NameRegistered',
          (args) =>
            args.owner === signer1.address && args.id.toHexString() === node
        );
        expect(await ens.name(domain).getAddress()).to.be.equal(
          signer1.address
        );
        expect(await ensDaoToken.ownerOf(node)).to.be.equal(signer1.address);
      });

      it('user can register when the max number of emission limit is reached', async () => {
        const totalSupply = await ensDaoToken.totalSupply();
        await ensDaoRegistrar.updateMaxEmissionNumber(totalSupply.toString());
        const tx = await ensDaoRegistrar
          .connect(signer1)
          .registerWithNamedTicket(label, namedTicket.ticket);
        expectEvent(
          await tx.wait(),
          'NameRegistered',
          (args) =>
            args.owner === signer1.address && args.id.toHexString() === node
        );
        expect(await ens.name(domain).getAddress()).to.be.equal(
          signer1.address
        );
        expect(await ensDaoToken.ownerOf(node)).to.be.equal(signer1.address);

        const updatedMaxEmissionNumber =
          await ensDaoRegistrar._maxEmissionNumber();
        expect(updatedMaxEmissionNumber.toString()).to.equal(
          totalSupply.add(1).toString()
        );
      });

      it('user can not register if it is not the expected address', async () => {
        await expect(
          ensDaoRegistrar
            .connect(signer2)
            .registerWithNamedTicket(label, namedTicket.ticket)
        ).to.be.revertedWith('TICKET_MANAGER: INVALID_TICKET');
      });

      it('user can not use the ticket twice', async () => {
        await ensDaoRegistrar
          .connect(signer1)
          .registerWithNamedTicket(label, namedTicket.ticket);
        await expect(
          ensDaoRegistrar
            .connect(signer1)
            .registerWithNamedTicket(label, namedTicket.ticket)
        ).to.be.revertedWith('TICKET_MANAGER: TICKET_ALREADY_CONSUMED');
      });

      it('user can not use a ticket from another day', async () => {
        await increaseTime(HRE, 3600 * 24);
        await expect(
          ensDaoRegistrar
            .connect(signer1)
            .registerWithNamedTicket(label, namedTicket.ticket)
        ).to.be.revertedWith('TICKET_MANAGER: INVALID_TICKET');
      });
    });

    describe('with anonymous tickets', () => {
      let anonymousTicket: TicketWrapper;

      beforeEach(async () => {
        const nonceGroup = await getDailyNonceGroup(HRE);
        anonymousTicket = await generateAnonymousTicket(
          HRE,
          ownerSigner,
          nonceGroup
        );
      });

      it('user can register', async () => {
        const tx = await ensDaoRegistrar
          .connect(signer1)
          .registerWithAnonymousTicket(
            label,
            anonymousTicket.message,
            anonymousTicket.signature
          );
        expectEvent(
          await tx.wait(),
          'NameRegistered',
          (args) =>
            args.owner === signer1.address && args.id.toHexString() === node
        );
        expect(await ens.name(domain).getAddress()).to.be.equal(
          signer1.address
        );
        expect(await ensDaoToken.ownerOf(node)).to.be.equal(signer1.address);
      });

      it('user can register when the max number of emission limit is reached', async () => {
        const totalSupply = await ensDaoToken.totalSupply();
        await ensDaoRegistrar.updateMaxEmissionNumber(totalSupply.toString());
        const tx = await ensDaoRegistrar
          .connect(signer1)
          .registerWithAnonymousTicket(
            label,
            anonymousTicket.message,
            anonymousTicket.signature
          );
        expectEvent(
          await tx.wait(),
          'NameRegistered',
          (args) =>
            args.owner === signer1.address && args.id.toHexString() === node
        );
        expect(await ens.name(domain).getAddress()).to.be.equal(
          signer1.address
        );
        expect(await ensDaoToken.ownerOf(node)).to.be.equal(signer1.address);

        const updatedMaxEmissionNumber =
          await ensDaoRegistrar._maxEmissionNumber();
        expect(updatedMaxEmissionNumber.toString()).to.equal(
          totalSupply.add(1).toString()
        );
      });

      it('user can not use the ticket twice', async () => {
        await ensDaoRegistrar
          .connect(signer1)
          .registerWithAnonymousTicket(
            label,
            anonymousTicket.message,
            anonymousTicket.signature
          );
        await expect(
          ensDaoRegistrar
            .connect(signer1)
            .registerWithAnonymousTicket(
              label,
              anonymousTicket.message,
              anonymousTicket.signature
            )
        ).to.be.revertedWith('TICKET_MANAGER: TICKET_ALREADY_CONSUMED');
      });

      it('user can not use a ticket from another day', async () => {
        await increaseTime(HRE, 3600 * 24);
        await expect(
          ensDaoRegistrar
            .connect(signer1)
            .registerWithAnonymousTicket(
              label,
              anonymousTicket.message,
              anonymousTicket.signature
            )
        ).to.be.revertedWith('TICKET_MANAGER: INVALID_TICKET');
      });

      it('a user can not use a ticket if limit of consumption is reached', async () => {
        const nonceGroup = await getDailyNonceGroup(HRE);
        const anonymousTickets = await Promise.all(
          [null, null, null].map(() =>
            generateAnonymousTicket(HRE, ownerSigner, nonceGroup)
          )
        );
        const labels = [label, 'second', 'third'];
        await ensDaoRegistrar
          .connect(signer1)
          .registerWithAnonymousTicket(
            labels[0],
            anonymousTickets[0].message,
            anonymousTickets[0].signature
          );
        await ensDaoRegistrar
          .connect(signer2)
          .registerWithAnonymousTicket(
            labels[1],
            anonymousTickets[1].message,
            anonymousTickets[1].signature
          );

        await expect(
          ensDaoRegistrar
            .connect(ownerSigner)
            .registerWithAnonymousTicket(
              labels[2],
              anonymousTickets[2].message,
              anonymousTickets[2].signature
            )
        ).to.be.revertedWith('TICKET_MANAGER: TICKET_GROUP_LIMIT_REACHED');
      });
    });
  });

  describe('max number of emission limitation', () => {
    it('user can not register once the max emission number is reached', async () => {
      const otherLabel = 'second';
      await ensDaoRegistrar.connect(signer1).register(label);

      const totalSupply = await ensDaoToken.totalSupply();

      const tx = await ensDaoRegistrar.updateMaxEmissionNumber(
        totalSupply.toString()
      );
      const receipt = await tx.wait();

      expectEvent(
        receipt,
        'MaxEmissionNumberUpdated',
        (args) => args.maxEmissionNumber.toString() === totalSupply.toString()
      );

      await expect(ensDaoRegistrar.register(otherLabel)).to.be.revertedWith(
        'ENS_DAO_REGISTRAR: TOO_MANY_EMISSION'
      );
    });

    it('user can not update the max emission number if not owner', async () => {
      await expect(
        ensDaoRegistrar.connect(signer1).updateMaxEmissionNumber('100')
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('owner can not decrease the max emission number lower than the current supply', async () => {
      await ensDaoRegistrar.connect(signer1).register(label);
      const totalSupply = await ensDaoToken.totalSupply();
      await expect(
        ensDaoRegistrar.updateMaxEmissionNumber(totalSupply.sub(1).toString())
      ).to.be.revertedWith('ENS_DAO_REGISTRAR: NEW_MAX_EMISSION_TOO_LOW');
    });
  });

  describe('root domain ownership', () => {
    it('user can not take back the root domain ownership if not owner', async () => {
      await expect(
        ensDaoRegistrar.connect(signer1).giveBackDomainOwnership()
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('owner can take back the root domain ownership', async () => {
      const tx = await ensDaoRegistrar.giveBackDomainOwnership();
      expectEvent(
        await tx.wait(),
        'OwnershipConceded',
        (args) => args.owner === ownerSigner.address
      );

      expect(await ens.name(`${sismoLabel}.eth`).getOwner()).to.be.equal(
        ownerSigner.address
      );
    });
  });
});
