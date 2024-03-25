// contracts/GameItem.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "https://github.com/Bubble-Protocol/bubble-sdk/blob/main/contracts/AccessControlledStorage.sol";
import "https://github.com/Bubble-Protocol/bubble-sdk/blob/main/contracts/AccessControlBits.sol";

/*
 * bubble structure
 */
uint constant ROOT = 0;
uint constant METADATA_FILE = 1;
uint constant SHARED_FILE_DIR = 2;
uint constant MESSAGING_DIR = 3;

contract SharedVault is AccessControlledStorage, AccessControl {

    bool terminated = false;
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
     * Returns true if the vault has been terminated
     */
    function isTerminated() public view returns (bool) {
        return terminated;
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
     * Provides the access permissions for the off-chain bubble
     */
    function getAccessPermissions( address user, uint256 contentId ) external view returns (uint256) {

        // Returning TERMINATED forces the bubble provider to delete the off-chain bubble
        if (terminated) return BUBBLE_TERMINATED_BIT;

        if (isMember(user)) {

            bool isAdminUser = isAdmin(user);

            // Root of bubble (owner: rw, others: r)
            if (contentId == ROOT) return isAdminUser ? READ_BIT | WRITE_BIT : READ_BIT;

            // Metadata File (owner: rw, member: r)
            else if (contentId == METADATA_FILE) return isAdminUser ? READ_BIT | WRITE_BIT : READ_BIT;

            // Shared file directory (member: drw)
            else if (contentId == SHARED_FILE_DIR) return DIRECTORY_BIT | READ_BIT | WRITE_BIT;

            // Messaging directory (member: dra)
            else if (contentId == MESSAGING_DIR) return DIRECTORY_BIT | READ_BIT | APPEND_BIT;

            // User metadata files (owner: w, member: rw)
            else {
                if (contentId == uint(uint160(user))) return READ_BIT | WRITE_BIT;
                else if (isAdminUser && isMember(address(uint160(contentId)))) return WRITE_BIT;
            }

        }

        // Default permissions
        return NO_PERMISSIONS;
    }

}