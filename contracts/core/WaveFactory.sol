// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.9;
pragma abicoder v2;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {WaveContract} from "./WaveContract.sol";
import {IWaveFactory} from "../interfaces/IWaveFactory.sol";

contract WaveFactory is Ownable, IWaveFactory {
    address[] public waves;
    address public keeper;
    address public trustedForwarder;
    address public verifier;

    event WaveCreated(address indexed wave, address indexed owner);

    constructor(
        address _keeper,
        address _trustedForwarder,
        address _verifier
    ) Ownable() {
        keeper = _keeper;
        trustedForwarder = _trustedForwarder;
        verifier = _verifier;
    }

    function changeKeeper(address _keeper) public onlyOwner {
        keeper = _keeper;
    }

    function changeTrustedForwarder(address _trustedForwarder)
        public
        onlyOwner
    {
        trustedForwarder = _trustedForwarder;
    }

    function changeVerifier(address _verifier) public onlyOwner {
        verifier = _verifier;
    }

    function deployWave(
        string memory _name,
        string memory _symbol,
        string memory _baseURI,
        uint256 _startTimestamp,
        uint256 _endTimestamp,
        bool _isTransferrable
    ) public override {
        WaveContract wave = new WaveContract(
            _name,
            _symbol,
            _baseURI,
            _startTimestamp,
            _endTimestamp,
            _isTransferrable,
            trustedForwarder
        );

        waves.push(address(wave));
        wave.transferOwnership(msg.sender);

        emit WaveCreated(address(wave), msg.sender);
    }
}
