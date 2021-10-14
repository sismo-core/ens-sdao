pragma solidity >=0.8.4;

interface IENSLabelBooker {
  event NameBooked(uint256 indexed id, address indexed bookingAddress);

  event BookingUpdated(uint256 indexed id, address indexed bookingAddress);

  function book(string memory label, address bookingAddress) external;

  function batchBook(string[] memory labels, address[] memory bookingAddresses)
    external;

  function updateBook(string memory label, address bookingAddress) external;

  function batchUpdateBook(
    string[] memory labels,
    address[] memory bookingAddresses
  ) external;
}
