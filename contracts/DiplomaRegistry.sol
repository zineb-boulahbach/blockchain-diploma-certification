// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

/**
 * @title DiplomaRegistry
 * @notice On-chain registry: PDF hash + IPFS CID + student wallet. Owner (school) issues and revokes.
 */
contract DiplomaRegistry {
    struct Diploma {
        bytes32 diplomaHash;
        string studentId;
        address studentWallet;
        uint256 issuanceDate;
        bool isRevoked;
        string ipfsCID;
        string studentName;
        string filiere;
        string yearObtained;
    }

    address public owner;

    mapping(bytes32 => Diploma) private diplomas;
    mapping(address => bytes32[]) private studentHashes;
    mapping(string => bytes32[]) private studentIdToHashes;

    event DiplomaAdded(
        bytes32 indexed diplomaHash,
        string studentId,
        address indexed studentWallet
    );
    event DiplomaRevoked(bytes32 indexed diplomaHash);

    error NotOwner();
    error DiplomaExists();
    error DiplomaUnknown();
    error AlreadyRevoked();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function addDiploma(
        bytes32 diplomaHash,
        string calldata studentId,
        address studentWallet,
        string calldata ipfsCID,
        string calldata studentName,
        string calldata filiere,
        string calldata yearObtained
    ) external onlyOwner {
        if (diplomas[diplomaHash].diplomaHash != bytes32(0)) revert DiplomaExists();

        diplomas[diplomaHash] = Diploma({
            diplomaHash: diplomaHash,
            studentId: studentId,
            studentWallet: studentWallet,
            issuanceDate: block.timestamp,
            isRevoked: false,
            ipfsCID: ipfsCID,
            studentName: studentName,
            filiere: filiere,
            yearObtained: yearObtained
        });

        studentHashes[studentWallet].push(diplomaHash);
        studentIdToHashes[studentId].push(diplomaHash);

        emit DiplomaAdded(diplomaHash, studentId, studentWallet);
    }

    function revokeDiploma(bytes32 diplomaHash) external onlyOwner {
        Diploma storage d = diplomas[diplomaHash];
        if (d.diplomaHash == bytes32(0)) revert DiplomaUnknown();
        if (d.isRevoked) revert AlreadyRevoked();
        d.isRevoked = true;
        emit DiplomaRevoked(diplomaHash);
    }

    function getDiploma(bytes32 diplomaHash) external view returns (Diploma memory) {
        return diplomas[diplomaHash];
    }

    function diplomaExists(bytes32 diplomaHash) external view returns (bool) {
        return diplomas[diplomaHash].diplomaHash != bytes32(0);
    }

    function getStudentDiplomas(address student) external view returns (bytes32[] memory) {
        return studentHashes[student];
    }

    function getHashesByStudentId(string calldata studentId) external view returns (bytes32[] memory) {
        return studentIdToHashes[studentId];
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero");
        owner = newOwner;
    }
}
