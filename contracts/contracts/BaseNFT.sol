// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title BaseNFT
 * @dev NFT contract for minting on Base network via Telegram bot
 * @notice Enhanced with ReentrancyGuard and Pausable for security
 */
contract BaseNFT is ERC721URIStorage, ERC721Enumerable, Ownable, ReentrancyGuard, Pausable {
    uint256 private _tokenIds;

    // Maximum supply (optional, set to 0 for unlimited)
    uint256 public maxSupply;

    // Mint price (can be 0 for free minting)
    uint256 public mintPrice;

    // Base URI for metadata
    string private _baseTokenURI;

    // Events
    event NFTMinted(address indexed to, uint256 indexed tokenId, string tokenURI);
    event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event MaxSupplyUpdated(uint256 oldSupply, uint256 newSupply);

    /**
     * @dev Constructor
     * @param name Token name
     * @param symbol Token symbol
     * @param _mintPrice Price to mint (in wei)
     * @param _maxSupply Maximum supply (0 for unlimited)
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 _mintPrice,
        uint256 _maxSupply
    ) ERC721(name, symbol) Ownable(msg.sender) {
        mintPrice = _mintPrice;
        maxSupply = _maxSupply;
    }

    /**
     * @dev Mint NFT to specified address
     * @param to Address to mint to
     * @param metadataURI Metadata URI for the NFT
     * @return tokenId The ID of the minted token
     */
    function mint(address to, string memory metadataURI) public payable nonReentrant whenNotPaused returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        require(msg.value >= mintPrice, "Insufficient payment");
        require(maxSupply == 0 || _tokenIds < maxSupply, "Max supply reached");

        _tokenIds++;
        uint256 newTokenId = _tokenIds;

        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, metadataURI);

        emit NFTMinted(to, newTokenId, metadataURI);

        // Refund excess payment
        if (msg.value > mintPrice) {
            uint256 refund = msg.value - mintPrice;
            (bool success, ) = payable(msg.sender).call{value: refund}("");
            require(success, "Refund failed");
        }

        return newTokenId;
    }

    /**
     * @dev Batch mint multiple NFTs
     * @param to Address to mint to
     * @param tokenURIs Array of metadata URIs
     */
    function batchMint(address to, string[] memory tokenURIs) public payable nonReentrant whenNotPaused {
        require(to != address(0), "Cannot mint to zero address");
        uint256 totalPrice = mintPrice * tokenURIs.length;
        require(msg.value >= totalPrice, "Insufficient payment");
        require(
            maxSupply == 0 || _tokenIds + tokenURIs.length <= maxSupply,
            "Would exceed max supply"
        );

        for (uint256 i = 0; i < tokenURIs.length; i++) {
            _tokenIds++;
            uint256 newTokenId = _tokenIds;

            _safeMint(to, newTokenId);
            _setTokenURI(newTokenId, tokenURIs[i]);

            emit NFTMinted(to, newTokenId, tokenURIs[i]);
        }

        // Refund excess payment
        if (msg.value > totalPrice) {
            uint256 refund = msg.value - totalPrice;
            (bool success, ) = payable(msg.sender).call{value: refund}("");
            require(success, "Refund failed");
        }
    }

    /**
     * @dev Get total number of minted tokens
     */
    function getCurrentTokenId() public view returns (uint256) {
        return _tokenIds;
    }

    /**
     * @dev Update mint price (owner only)
     */
    function setMintPrice(uint256 newPrice) public onlyOwner {
        uint256 oldPrice = mintPrice;
        mintPrice = newPrice;
        emit MintPriceUpdated(oldPrice, newPrice);
    }

    /**
     * @dev Update max supply (owner only)
     */
    function setMaxSupply(uint256 newMaxSupply) public onlyOwner {
        uint256 oldSupply = maxSupply;
        maxSupply = newMaxSupply;
        emit MaxSupplyUpdated(oldSupply, newMaxSupply);
    }

    /**
     * @dev Set base URI (owner only)
     */
    function setBaseURI(string memory baseURI) public onlyOwner {
        _baseTokenURI = baseURI;
    }

    /**
     * @dev Withdraw contract balance (owner only)
     */
    function withdraw() public onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @dev Pause minting (owner only)
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause minting (owner only)
     */
    function unpause() public onlyOwner {
        _unpause();
    }

    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Base URI for computing tokenURI
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
}
