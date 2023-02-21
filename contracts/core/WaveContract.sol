// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.9;
pragma abicoder v2;

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC2771Context, Context} from "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import {IWaveFactory} from "../interfaces/IWaveFactory.sol";

contract WaveContract is ERC2771Context, Ownable, ERC721 {
    IWaveFactory factory;

    uint256 public lastId;
    uint256 public startTimestamp;
    uint256 public endTimestamp;

    string baseURI;
    bool public customMetadata;
    bool public isTransferrable;
    bytes32 public immutable DOMAIN_SEPARATOR;
    bytes32 public immutable PERMIT_TYPEHASH;

    mapping(bytes32 => bool) claimed;
    mapping(uint256 => uint256) public tokenIdToRewardId;

    struct ClaimParams {
        uint256 rewardId;
        address user;
    }

    struct Permit {
        address spender;
        uint256 rewardId;
        uint256 deadline;
    }

    error OnlyKeeper();
    error InvalidTimings();
    error InvalidSignature();
    error CampaignNotActive();
    error RewardAlreadyClaimed();
    error PermitDeadlineExpired();

    event Claimed(
        address indexed user,
        uint256 indexed tokenId,
        uint256 rewardId
    );

    modifier onlyKeeper() {
        if (_msgSender() != factory.keeper()) revert OnlyKeeper();
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _baseURI,
        uint256 _startTimestamp,
        uint256 _endTimestamp,
        bool _isTransferrable,
        address _trustedForwarder
    ) ERC2771Context(_trustedForwarder) Ownable() ERC721(_name, _symbol) {
        if (_startTimestamp > _endTimestamp) revert InvalidTimings();

        factory = IWaveFactory(_msgSender());
        baseURI = _baseURI;
        startTimestamp = _startTimestamp;
        endTimestamp = _endTimestamp;
        isTransferrable = _isTransferrable;

        DOMAIN_SEPARATOR = _computeDomainSeparator();
        PERMIT_TYPEHASH = keccak256(
            "Permit(address spender,uint256 rewardId,uint256 deadline)"
        );
    }

    function changeBaseURI(string memory _baseURI, bool _customMetadata)
        public
        onlyKeeper
    {
        baseURI = _baseURI;
        customMetadata = _customMetadata;
    }

    function changeTimings(uint256 _startTimestamp, uint256 _endTimestamp)
        public
        onlyOwner
    {
        if (_startTimestamp > _endTimestamp) revert InvalidTimings();
        startTimestamp = _startTimestamp;
        endTimestamp = _endTimestamp;
    }

    // Execute the mint with permit by verifying the off-chain verifier signature.
    // Also works with gasless EIP-2612 forwarders
    function claim(
        uint256 rewardId,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public virtual {
        if (claimed[keccak256(abi.encode(_msgSender(), rewardId))])
            revert RewardAlreadyClaimed();
        if (block.timestamp > deadline) revert PermitDeadlineExpired();
        if (block.timestamp < startTimestamp || block.timestamp > endTimestamp)
            revert CampaignNotActive();

        bytes32 typedDataHash = getTypedDataHash(
            Permit(_msgSender(), rewardId, deadline)
        );
        address recoveredAddress = ecrecover(_prefixed(typedDataHash), v, r, s);

        if (
            recoveredAddress == address(0) ||
            recoveredAddress != factory.verifier()
        ) revert InvalidSignature();

        _mintReward(_msgSender(), rewardId);
    }

    // computes the hash of the fully encoded EIP-712 message for the domain, which can be used to recover the signer
    function getTypedDataHash(Permit memory _permit)
        public
        view
        returns (bytes32)
    {
        return
            keccak256(
                abi.encodePacked(
                    "\x19\x01",
                    DOMAIN_SEPARATOR,
                    _getStructHash(_permit)
                )
            );
    }

    function airdrop(ClaimParams[] memory params) public onlyOwner {
        uint256 len = params.length;
        for (uint256 i = 0; i < len; ++i) {
            _safeMint(params[i].user, ++lastId);

            tokenIdToRewardId[lastId] = params[i].rewardId;
            claimed[
                keccak256(abi.encode(params[i].user, params[i].rewardId))
            ] = true;

            emit Claimed(params[i].user, lastId, params[i].rewardId);
        }
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        _requireMinted(tokenId);
        return
            customMetadata
                ? string(
                    abi.encodePacked(
                        baseURI,
                        "/",
                        Strings.toString(tokenId),
                        ".json"
                    )
                )
                : string(
                    abi.encodePacked(
                        baseURI,
                        "/",
                        Strings.toString(tokenIdToRewardId[tokenId]),
                        ".json"
                    )
                );
    }

    ///@dev used for changing rewardId associated to some tokens
    function award(uint256[] memory winnerIds, uint256 rewardId)
        public
        onlyOwner
    {
        for (uint256 i = 0; i < winnerIds.length; i++) {
            tokenIdToRewardId[winnerIds[i]] = rewardId;
        }
    }

    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override {
        require(isTransferrable, "Soulbound: transfer not allowed");
        super._transfer(from, to, tokenId);
    }

    function _mintReward(address user, uint256 rewardId) internal {
        _safeMint(user, ++lastId);
        tokenIdToRewardId[lastId] = rewardId;
        claimed[keccak256(abi.encode(user, rewardId))] = true;
        emit Claimed(user, lastId, rewardId);
    }

    ///@dev use ERC2771Context to get sender and data
    function _msgData()
        internal
        view
        override(ERC2771Context, Context)
        returns (bytes calldata)
    {
        return ERC2771Context._msgData();
    }

    function _msgSender()
        internal
        view
        override(ERC2771Context, Context)
        returns (address)
    {
        return ERC2771Context._msgSender();
    }

    function _computeDomainSeparator() internal view virtual returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    keccak256(
                        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                    ),
                    keccak256(bytes(name())),
                    keccak256("1"),
                    block.chainid,
                    address(this)
                )
            );
    }

    // computes the hash of a permit
    function _getStructHash(Permit memory _permit)
        internal
        view
        returns (bytes32)
    {
        return
            keccak256(
                abi.encode(
                    PERMIT_TYPEHASH,
                    _permit.spender,
                    _permit.rewardId,
                    _permit.deadline
                )
            );
    }

    // Builds a prefixed hash to mimic the behavior of eth_sign.
    function _prefixed(bytes32 hash) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)
            );
    }
}
