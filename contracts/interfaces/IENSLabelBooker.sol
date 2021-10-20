pragma solidity >=0.8.4;

/**
 * @title IENSLabelBooker interface
 * @notice An owned contract that allows the owner to manage bookings of ENS sudomain.
 *
 *         A booking is a link between the hash of a label, representing the subdomain, and an address.
 *         A link to the zero address means that the label is not booked.
 *
 *         Any action may be performed on a single label or by batch.
 *
 *         A booking may be
 *          - created: the hash of the label is linked to a non zero address,
 *          - updated: the booking address is updated to a non zero address,
 *          - deleted: the booking address is set to the zero address.
 */
interface IENSLabelBooker {
  /**
   * @dev Emitted when a name is booked.
   */
  event NameBooked(uint256 indexed id, address indexed bookingAddress);
  /**
   * @dev Emitted when a booking is updated.
   */
  event BookingUpdated(uint256 indexed id, address indexed bookingAddress);
  /**
   * @dev Emitted when a booking is deleted.
   */
  event BookingDeleted(uint256 indexed id);
  event NewRegistrar(address indexed registrar);

  /**
   * @notice Get the address of a booking.
   * @param label The booked label.
   * @return The address associated to the booking
   */
  function getBooking(string memory label) external view returns (address);

  /**
   * @notice Book a name.
   * @param label The label to book.
   * @param bookingAddress The address associated to the booking.
   *
   * Emits a {NameBooked} event.
   */
  function book(string memory label, address bookingAddress) external;

  /**
   * @notice Books a list of names.
   * @param labels The list of label to book.
   * @param bookingAddresses The list of addresses associated to the bookings.
   *
   * Emits a {NameBooked} event for each booking.
   */
  function batchBook(string[] memory labels, address[] memory bookingAddresses)
    external;

  /**
   * @notice Update a booking.
   * @param label The booked label.
   * @param bookingAddress The new address associated to the booking.
   *
   * Emits a {BookingUpdated} event.
   */
  function updateBooking(string memory label, address bookingAddress) external;

  /**
   * @notice Update a list of bookings.
   * @param labels The list of labels of the bookings.
   * @param bookingAddresses The list of new addresses associated to the bookings.
   *
   * Emits a {BookingUpdated} event for each updated booking.
   */
  function batchUpdateBooking(
    string[] memory labels,
    address[] memory bookingAddresses
  ) external;

  /**
   * @notice Delete a booking.
   * @param label The booked label.
   *
   * Emits a {BookingDeleted} event.
   */
  function deleteBooking(string memory label) external;

  /**
   * @notice Delete a list of bookings.
   * @param labels The list of labels of the bookings.
   *
   * Emits a {BookingDeleted} event for each deleted booking.
   */
  function batchDeleteBooking(string[] memory labels) external;

  /**
   * @notice Set the registrar, that can use this lib.
   * @param registrar the newt registrar.
   *
   * Emits a {NewRegistrar} event
   */
  function setRegistrar(address registrar) external;
}
