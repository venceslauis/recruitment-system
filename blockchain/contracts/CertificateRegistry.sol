// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title CertificateRegistry
 * @notice Tamper-proof on-chain registry for job-applicant certificates.
 *         Only the contract owner (deployer) can register certificates.
 *         Anyone can query whether a certificate hash has been registered.
 *
 * How it works:
 *  1. Backend hashes the uploaded PDF/image with SHA-256 (hex string → bytes32).
 *  2. Backend calls registerCertificate(bytes32 hash) on this contract.
 *  3. The hash is stored on-chain permanently — immutable and publicly verifiable.
 *  4. isCertificateVerified(hash) returns true/false for any subsequent check.
 */
contract CertificateRegistry {

    /* ─────────────────────────────────────────
       State
    ───────────────────────────────────────── */

    address public owner;

    // certHash → registered?
    mapping(bytes32 => bool) private _verified;

    // certHash → who registered it (candidateId as a string label)
    mapping(bytes32 => string) private _registeredBy;

    // certHash → block timestamp of registration
    mapping(bytes32 => uint256) private _registeredAt;

    // Running count of all registered certificates
    uint256 public totalCertificates;

    /* ─────────────────────────────────────────
       Events
    ───────────────────────────────────────── */

    event CertificateRegistered(
        bytes32 indexed certHash,
        string  candidateId,
        uint256 timestamp
    );

    /* ─────────────────────────────────────────
       Modifiers
    ───────────────────────────────────────── */

    modifier onlyOwner() {
        require(msg.sender == owner, "CertificateRegistry: caller is not owner");
        _;
    }

    /* ─────────────────────────────────────────
       Constructor
    ───────────────────────────────────────── */

    constructor() {
        owner = msg.sender;
    }

    /* ─────────────────────────────────────────
       Write Functions
    ───────────────────────────────────────── */

    /**
     * @notice Register a certificate hash on-chain.
     * @param certHash   SHA-256 hash of the certificate file (as bytes32).
     * @param candidateId MongoDB ObjectId of the candidate (stored as label only).
     *
     * Only the deployer (owner) can call this.
     * Reverts if the certificate is already registered.
     */
    function registerCertificate(bytes32 certHash, string calldata candidateId)
        external
        onlyOwner
    {
        require(!_verified[certHash], "CertificateRegistry: already registered");

        _verified[certHash]      = true;
        _registeredBy[certHash]  = candidateId;
        _registeredAt[certHash]  = block.timestamp;
        totalCertificates++;

        emit CertificateRegistered(certHash, candidateId, block.timestamp);
    }

    /* ─────────────────────────────────────────
       Read Functions
    ───────────────────────────────────────── */

    /**
     * @notice Check if a certificate hash is verified on-chain.
     * @param certHash  SHA-256 hash of the certificate (as bytes32).
     */
    function isCertificateVerified(bytes32 certHash)
        external
        view
        returns (bool)
    {
        return _verified[certHash];
    }

    /**
     * @notice Get full metadata of a registered certificate.
     * @param certHash  SHA-256 hash (bytes32).
     * @return verified     true if on chain
     * @return candidateId  label of who submitted it
     * @return timestamp    Unix timestamp of when it was registered
     */
    function getCertificateInfo(bytes32 certHash)
        external
        view
        returns (
            bool    verified,
            string  memory candidateId,
            uint256 timestamp
        )
    {
        verified    = _verified[certHash];
        candidateId = _registeredBy[certHash];
        timestamp   = _registeredAt[certHash];
    }

    /* ─────────────────────────────────────────
       Owner Management
    ───────────────────────────────────────── */

    /**
     * @notice Transfer ownership to a new address.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "CertificateRegistry: zero address");
        owner = newOwner;
    }
}
