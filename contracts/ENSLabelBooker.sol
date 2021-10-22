pragma solidity >=0.8.4;

import '@ensdomains/ens-contracts/contracts/registry/ENS.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import {IENSLabelBooker} from './interfaces/IENSLabelBooker.sol';

/**
 * @title ENSLabelBooker contract.
 * @dev Implementation of the {IENSLabelBooker}.
 */
contract ENSLabelBooker is Ownable, IENSLabelBooker {
  ENS public immutable ENS_REGISTRY;
  bytes32 public immutable ROOT_NODE;
  address public _registrar;

  mapping(bytes32 => address) private _bookings;

  modifier onlyOwnerOrRegistrar() {
    require(
      owner() == _msgSender() || _registrar == _msgSender(),
      'ENS_LABEL_BOOKER: CALL_NOT_AUTHORIZED'
    );
    _;
  }

  /**
   * @dev Constructor.
   * @param ensAddr The address of the ENS registry.
   * @param node The node that this registrar administers.
   * @param owner The owner of the contract.
   */
  constructor(
    ENS ensAddr,
    bytes32 node,
    address owner
  ) {
    ENS_REGISTRY = ensAddr;
    ROOT_NODE = node;
    transferOwnership(owner);
  }

  /**
   * @notice Get the address of a booking.
   *         The zero address means the booking does not exist.
   * @param label The booked label.
   * @return The address associated to the booking.
   */
  function getBooking(string memory label)
    external
    view
    override
    returns (address)
  {
    bytes32 labelHash = keccak256(bytes(label));
    return _getBooking(labelHash);
  }

  /**
   * @notice Book a label with an address for a later claim.
   * @dev Can only be called by the contract owner or the registrar.
   * @param label The label to book.
   * @param bookingAddress The address which can claim the label.
   */
  function book(string memory label, address bookingAddress)
    external
    override
    onlyOwnerOrRegistrar
  {
    bytes32 labelHash = keccak256(bytes(label));
    _book(labelHash, bookingAddress);
  }

  /**
   * @notice Batch book operations given a list of labels and bookingAddresses.
   * @dev Can only be called by the contract owner or the registrar.
   *      Input lists must have the same length.
   * @param labels The list of label to book.
   * @param bookingAddresses The list of address which can claim the associated label.
   */
  function batchBook(string[] memory labels, address[] memory bookingAddresses)
    external
    override
    onlyOwnerOrRegistrar
  {
    require(
      labels.length == bookingAddresses.length,
      'ENS_LABEL_BOOKER: INVALID_PARAMS'
    );
    for (uint256 i; i < labels.length; i++) {
      bytes32 labelHash = keccak256(bytes(labels[i]));
      _book(labelHash, bookingAddresses[i]);
    }
  }

  /**
   * @notice Update the address of a book address.
   * @dev Can only be called by the contract owner or the registrar.
   * @param label The label of the book.
   * @param bookingAddress The address which can claim the label.
   */
  function updateBooking(string memory label, address bookingAddress)
    external
    override
    onlyOwnerOrRegistrar
  {
    bytes32 labelHash = keccak256(bytes(label));
    _updateBooking(labelHash, bookingAddress);
  }

  /**
   * @notice Update the addresses of books.
   * @dev Can only be called by the contract owner or the registrar.
   *      Input lists must have the same length.
   * @param labels The list of label to book.
   * @param bookingAddresses The list of address which can claim the associated label.
   */
  function batchUpdateBooking(
    string[] memory labels,
    address[] memory bookingAddresses
  ) external override onlyOwner {
    require(
      labels.length == bookingAddresses.length,
      'ENS_LABEL_BOOKER: INVALID_PARAMS'
    );
    for (uint256 i; i < labels.length; i++) {
      bytes32 labelHash = keccak256(bytes(labels[i]));
      _updateBooking(labelHash, bookingAddresses[i]);
    }
  }

  /**
   * @notice Delete a booking.
   * @dev Can only be called by the contract owner or the registrar.
   * @param label The booked label.
   */
  function deleteBooking(string memory label)
    external
    override
    onlyOwnerOrRegistrar
  {
    bytes32 labelHash = keccak256(bytes(label));
    _deleteBooking(labelHash);
  }

  /**
   * @notice Delete a list of bookings.
   * @dev Can only be called by the contract owner or the registrar.
   * @param labels The list of labels of the bookings.
   */
  function batchDeleteBooking(string[] memory labels)
    external
    override
    onlyOwnerOrRegistrar
  {
    for (uint256 i; i < labels.length; i++) {
      bytes32 labelHash = keccak256(bytes(labels[i]));
      _deleteBooking(labelHash);
    }
  }

  /**
   * @notice Delete a list of bookings.
   * @dev Can only be called by the contract owner.
   * @param registrar The new registrar that uses this contract as labelBooker Lib
   */
  function setRegistrar(address registrar) external override onlyOwner {
    _registrar = registrar;
    emit NewRegistrar(registrar);
  }

  /**
   * @dev Get the address of a booking.
   * @param labelHash The hash of the label associated to the booking.
   * @return The address associated to the booking.
   */
  function _getBooking(bytes32 labelHash) internal view returns (address) {
    return _bookings[labelHash];
  }

  /**
   * @dev Delete a booking
   * @param labelHash The hash of the label associated to the booking.
   */
  function _deleteBooking(bytes32 labelHash) internal {
    bytes32 childNode = keccak256(abi.encodePacked(ROOT_NODE, labelHash));
    _bookings[labelHash] = address(0);
    emit BookingDeleted(uint256(childNode));
  }

  /**
   * @dev Create a booking
   * @param labelHash The hash of the label associated to the booking.
   * @param bookingAddress The address associated to the booking.
   */
  function _book(bytes32 labelHash, address bookingAddress) internal {
    require(
      bookingAddress != address(0),
      'ENS_LABEL_BOOKER: INVALID_BOOKING_ADDRESS'
    );
    require(
      _bookings[labelHash] == address(0),
      'ENS_LABEL_BOOKER: LABEL_ALREADY_BOOKED'
    );
    address subdomainOwner = ENS_REGISTRY.owner(
      keccak256(abi.encodePacked(ROOT_NODE, labelHash))
    );
    require(
      subdomainOwner == address(0x0),
      'ENS_LABEL_BOOKER: SUBDOMAINS_ALREADY_REGISTERED'
    );
    bytes32 childNode = keccak256(abi.encodePacked(ROOT_NODE, labelHash));
    _bookings[labelHash] = bookingAddress;
    emit NameBooked(uint256(childNode), bookingAddress);
  }

  /**
   * @dev Update the address of a booking
   * @param labelHash The hash of the label associated to the booking.
   * @param bookingAddress The new address associated to the booking.
   */
  function _updateBooking(bytes32 labelHash, address bookingAddress) internal {
    require(bookingAddress != address(0), 'ENS_LABEL_BOOKER: INVALID_ADDRESS');
    require(
      _bookings[labelHash] != address(0),
      'ENS_LABEL_BOOKER: LABEL_NOT_BOOKED'
    );
    bytes32 childNode = keccak256(abi.encodePacked(ROOT_NODE, labelHash));
    _bookings[labelHash] = bookingAddress;
    emit BookingUpdated(uint256(childNode), bookingAddress);
  }
}
