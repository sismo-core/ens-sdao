import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import {
  generateAnonymousTicket,
  generateNamedTicket,
  getDailyNonceGroup,
  Ticket,
} from '../utils';
import { getDeployer, logHre } from '../utils/hre-utils';

type GenerateTicketsArgs = {
  namedticketaddresses?: string;
  anonymousticketnumber?: number;
  log?: boolean;
};

type GeneratedTickets = {
  namedTickets: Ticket[];
  anonymousTickets: Ticket[];
};

async function action(
  {
    namedticketaddresses = '[]',
    anonymousticketnumber = 0,
    log,
  }: GenerateTicketsArgs,
  hre: HardhatRuntimeEnvironment
): Promise<GeneratedTickets> {
  if (log) await logHre(hre);

  const ticketSigner = await getDeployer(hre, log);

  console.log(
    'namedticketaddresses: ',
    namedticketaddresses,
    typeof namedticketaddresses
  );

  const namedTicketAddresses: string[] = JSON.parse(namedticketaddresses);

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

  const anonymousTickets: Ticket[] = [];
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
