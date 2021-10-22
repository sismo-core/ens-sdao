import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

export type TicketIngredients = {
  message: string;
  messageWithNonce: string;
  signature: string;
};

export type TicketWrapper = {
  ticket: string;
} & TicketIngredients;

export async function generateTicketIngredients(
  hre: HardhatRuntimeEnvironment,
  signer: SignerWithAddress,
  nonceGroup: number,
  salt: string
): Promise<TicketIngredients> {
  const { solidityKeccak256, solidityPack, arrayify } = hre.ethers.utils;

  const message = solidityKeccak256(['bytes'], [arrayify(salt)]);

  const packed = solidityPack(['bytes32', 'uint256'], [message, nonceGroup]);

  const messageWithNonce = solidityKeccak256(['bytes'], [arrayify(packed)]);

  const signature = await signer.signMessage(arrayify(messageWithNonce));

  return {
    message,
    messageWithNonce,
    signature,
  };
}

export async function generateNamedTicket(
  hre: HardhatRuntimeEnvironment,
  signer: SignerWithAddress,
  account: string,
  nonceGroup: number
): Promise<TicketWrapper> {
  const salt = hre.ethers.utils.solidityPack(['address'], [account]);

  const ticketIngredients = await generateTicketIngredients(
    hre,
    signer,
    nonceGroup,
    salt
  );

  return {
    ...ticketIngredients,
    ticket: ticketIngredients.signature,
  };
}

export async function generateAnonymousTicket(
  hre: HardhatRuntimeEnvironment,
  signer: SignerWithAddress,
  nonceGroup: number
): Promise<TicketWrapper> {
  const salt = hre.ethers.utils.solidityPack(
    ['string'],
    [`sismo_${Math.floor(100000000 * Math.random())}`]
  );

  const ticketIngredients = await generateTicketIngredients(
    hre,
    signer,
    nonceGroup,
    salt
  );

  return {
    ...ticketIngredients,
    ticket: `${ticketIngredients.message}${ticketIngredients.signature.substr(
      2
    )}`,
  };
}

export async function getDailyNonceGroup(
  hre: HardhatRuntimeEnvironment
): Promise<number> {
  const latestBlock = await hre.ethers.provider.getBlock('latest');
  const currentDay = Math.floor(latestBlock.timestamp / 86400);
  return currentDay;
}
