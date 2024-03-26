// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/AccessControl.sol";
import "https://github.com/Bubble-Protocol/bubble-sdk/blob/main/contracts/AccessControlledStorage.sol";
import "https://github.com/Bubble-Protocol/bubble-sdk/blob/main/contracts/AccessControlBits.sol";


/**
 * DApp smart contract for use in the 'Introduction To Bubble Protocol' workshop series.
 *
 * The goal of the workshop series is to build step-by-step a working file vault dapp that lets
 * members of the vault share files and communicate via an end-to-end encrypted multi-user 
 * bubble.  
 * 
 * This is the version for workshop 1, which does not yet support multi-user encryption.
 *
 * This contract contains both the on-chain logic for a shared vault and the off-chain bubble
 * permissions.  It could instead be split into two contracts, one with the dapp logic and the
 * other with the bubble permissions.
 */

contract SharedVault is AccessControl, AccessControlledStorage {

    bool public terminated = false;
    mapping (address => bool) members;


    constructor(address ownerLogin) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(DEFAULT_ADMIN_ROLE, ownerLogin);
        members[ownerLogin] = true;
    }


    /**
     * Returns true if the given user is an administrator of this shared vault
     */
    function isAdmin(address user) public view returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, user);
    }


    /**
     * Returns true if the given user is a member of this shared vault
     */
    function isMember(address user) public view returns (bool) {
        return members[user];
    }


    /**
     * Adds or removes members
     */
    function setMembers(address[] memory users, bool to) public onlyRole(DEFAULT_ADMIN_ROLE) {
        for (uint i=0; i<users.length; i++) {
            members[users[i]] = to;
        }
    }


    /**
     * Terminates the vault causing the off-chain bubble to be deleted
     */
    function terminate() external onlyRole(DEFAULT_ADMIN_ROLE) {
        require (!terminated, "already terminated");
        terminated = true;
    }


    /**
     * The off-chain storage service's Guardian software uses this method to determine the access
     * permissions for a user request.
     */
    function getAccessPermissions( address user, uint256 contentId ) override external view returns (uint256) {

        // If the bubble has been terminated, the off-chain storage service will delete the bubble
        if (terminated) return BUBBLE_TERMINATED_BIT;

        if (isMember(user)) {

            // Root of bubble (admin: rw, members: r)
            if (contentId == ROOT) return isAdmin(user) ? READ_BIT | WRITE_BIT : READ_BIT;

            // Metadata File (admin: rw, members: r)
            else if (contentId == METADATA_FILE) return isAdmin(user) ? READ_BIT | WRITE_BIT : READ_BIT;

            // Shared file directory (all: drw)
            else if (contentId == SHARED_FILE_DIR) return DIRECTORY_BIT | READ_BIT | WRITE_BIT;

            // Messaging directory (all: dra)
            else if (contentId == MESSAGING_DIR) return DIRECTORY_BIT | READ_BIT | APPEND_BIT;

        }

        // Default permissions
        return NO_PERMISSIONS;

    }

}


/*
 * bubble structure
 */
uint constant ROOT = 0;
uint constant METADATA_FILE = 1;
uint constant SHARED_FILE_DIR = 2;
uint constant MESSAGING_DIR = 3;


