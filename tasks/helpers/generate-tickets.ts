import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import {
  generateAnonymousTicket,
  generateNamedTicket,
  getDailyNonceGroup,
  TicketWrapper,
} from '../utils';
import { getDeployer, logHre } from '../utils/hre-utils';

type GenerateTicketsArgs = {
  namedticketaddresses?: string;
  anonymousticketnumber?: number;
  log?: boolean;
};

type GeneratedTickets = {
  namedTickets: TicketWrapper[];
  anonymousTickets: TicketWrapper[];
};

// ###### To be filled by ticket signer ######

// To be filled with needed number
const defaultAnonymousTicketNumber = 5;
// To be filled with needed addresses
const addresses: string[] = [];

// ###### ###### ###### ###### ###### ###### ######

const defaultRawNamedTicketAddresses = JSON.stringify(addresses);

async function action(
  {
    namedticketaddresses:
      rawNamedTicketAddresses = defaultRawNamedTicketAddresses,
    anonymousticketnumber = defaultAnonymousTicketNumber,
    log,
  }: GenerateTicketsArgs,
  hre: HardhatRuntimeEnvironment
): Promise<GeneratedTickets> {
  if (log) await logHre(hre);

  const ticketSigner = await getDeployer(hre, log);

  let namedTicketAddresses: string[];
  try {
    namedTicketAddresses = JSON.parse(rawNamedTicketAddresses);
  } catch (err) {
    throw new Error('Invalid namedticketaddresses arguments');
  }

  namedTicketAddresses.forEach((address) => {
    const isValidAddress = hre.ethers.utils.isAddress(address);
    if (!isValidAddress) {
      throw new Error('Invalid address in arguments');
    }
  });

  const nonceGroup = await getDailyNonceGroup(hre);

  const namedTickets = await Promise.all(
    namedTicketAddresses.map((address) =>
      generateNamedTicket(hre, ticketSigner, address, nonceGroup)
    )
  );

  const anonymousTickets: TicketWrapper[] = [];
  for (let i = 0; i < anonymousticketnumber; i++) {
    const ticket = await generateAnonymousTicket(hre, ticketSigner, nonceGroup);
    anonymousTickets.push(ticket);
  }

  if (log) {
    console.log('Named tickets: ', namedTickets);
    console.log('Anonymous tickets: ', anonymousTickets);
  }

  return {
    namedTickets,
    anonymousTickets,
  };
}

task('generate-tickets')
  .addOptionalParam(
    'namedticketaddresses',
    'array of ticket addresses for generating named tickets'
  )
  .addOptionalParam(
    'anonymousticketnumber',
    'number of anonymous ticket to be generated'
  )
  .addFlag('log', 'log')
  .setAction(action);
