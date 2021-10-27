import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { getWeeklyGroupId, SignedTicket, generateEIP712Ticket } from '../utils';
import { getDeployer, logHre } from '../utils/hre-utils';

type GenerateTicketsArgs = {
  addresses?: string;
  contract?: string;
  log?: boolean;
};

type GeneratedTickets = SignedTicket[];

// ###### To be filled by ticket signer ######
// To be filled with needed addresses
const defaultAddresses: string[] = [];

const defaultVerifyingContract = '';

// ###### ###### ###### ###### ###### ###### ######

const defaultRawAddresses = JSON.stringify(defaultAddresses);

async function action(
  {
    addresses: rawAddresses = defaultRawAddresses,
    contract: verifyingContract = defaultVerifyingContract,
    log,
  }: GenerateTicketsArgs,
  hre: HardhatRuntimeEnvironment
): Promise<GeneratedTickets> {
  if (log) await logHre(hre);

  const ticketSigner = await getDeployer(hre, log);

  let addresses: string[];
  try {
    addresses = JSON.parse(rawAddresses);
  } catch (err) {
    throw new Error('Invalid addresses arguments');
  }

  addresses.forEach((address) => {
    const isValidAddress = hre.ethers.utils.isAddress(address);
    if (!isValidAddress) {
      throw new Error('Invalid address in arguments');
    }
  });

  const groupId = await getWeeklyGroupId(hre);

  const tickets = await Promise.all(
    addresses.map((address) =>
      generateEIP712Ticket({
        signer: ticketSigner,
        recipient: address,
        groupId,
        verifyingContract,
      })
    )
  );

  if (log) {
    console.log('Tickets: ', tickets);
  }

  return tickets;
}

task('generate-tickets')
  .addOptionalParam(
    'addresses',
    'array of ticket addresses for generating named tickets'
  )
  .addOptionalParam('contract', 'verifying contract address')
  .addFlag('log', 'log')
  .setAction(action);
