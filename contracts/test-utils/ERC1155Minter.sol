pragma solidity >=0.8.4;

import '@openzeppelin/contracts/token/ERC1155/presets/ERC1155PresetMinterPauser.sol';

contract ERC1155Minter is ERC1155PresetMinterPauser {
  constructor(string memory baseTokenUri, address owner)
    ERC1155PresetMinterPauser(baseTokenUri)
  {
    _setupRole(DEFAULT_ADMIN_ROLE, owner);
  }
}
