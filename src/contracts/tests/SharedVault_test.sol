// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;
import "remix_tests.sol"; // this import is automatically injected by Remix.
import "hardhat/console.sol";
import { SharedVault } from "../SharedVault.sol";
import "https://github.com/Bubble-Protocol/bubble-sdk/blob/main/contracts/AccessControlBits.sol";


contract SharedVaultTest {

    //bubble structure
    uint constant ROOT = 0;
    uint constant METADATA_FILE = 1;
    uint constant SHARED_FILE_DIR = 2;
    uint constant MESSAGING_DIR = 3;

    // Test Variables
    address creator = address(this);
    address[] users;
    SharedVault uut;


    function beforeAll () public {
        users.push(address(0x1000)); // owner login
        users.push(address(0x1001));
        users.push(address(0x1002));
        users.push(address(0x1003));
        uut = new SharedVault(users[0]);
    }

    function confirmAdminStatus() public {
        Assert.ok(uut.isAdmin(creator), "deployer should be an administrator");
        Assert.ok(uut.isAdmin(users[0]), "owner login should be an administrator");
    }

    function checkOwnerIsMember() public {
        Assert.ok(!uut.isMember(creator), "deployer should not be a member");
        Assert.ok(uut.isMember(users[0]), "owner login should be a member");
    }

    function checkOwnerAccess() public {
        // root: rw
        Assert.equal(uut.getAccessPermissions(users[0], ROOT), READ_BIT | WRITE_BIT, "owner should be able to access root");
        // metadata file: rw
        Assert.equal(uut.getAccessPermissions(users[0], METADATA_FILE), READ_BIT | WRITE_BIT, "owner should have rw access to the metadata file");
        // shared file directory: drw
        Assert.equal(uut.getAccessPermissions(users[0], SHARED_FILE_DIR), DIRECTORY_BIT | READ_BIT | WRITE_BIT, "owner should have rw access to the shared directory");
        // messaging directory: dra
        Assert.equal(uut.getAccessPermissions(users[0], MESSAGING_DIR), DIRECTORY_BIT | READ_BIT | APPEND_BIT, "owner should have ra access to the messaging directory");
        // owner metadata file: rw
        Assert.equal(uut.getAccessPermissions(users[0], uint(uint160(users[0]))), READ_BIT | WRITE_BIT, "owner should be able to read and write own metadata file");
        // all other files: -
        Assert.equal(uut.getAccessPermissions(users[0], uint(uint160(users[1]))), NO_PERMISSIONS, "owner should not have access to a non-member's metadata file");
    }

    function checkNonMemberCannotAccess() public {
        Assert.ok(!uut.isMember(users[1]), "user is a member");
        // non-members have no access to the bubble
        Assert.equal(uut.getAccessPermissions(users[1], ROOT), NO_PERMISSIONS, "non member should not be able to access root");
        Assert.equal(uut.getAccessPermissions(users[1], METADATA_FILE), NO_PERMISSIONS, "non member should not be able to access metadata file");
        Assert.equal(uut.getAccessPermissions(users[1], SHARED_FILE_DIR), NO_PERMISSIONS, "non member should not be able to access shared directory");
        Assert.equal(uut.getAccessPermissions(users[1], MESSAGING_DIR), NO_PERMISSIONS, "non member should not be able to access messaging directory");
        Assert.equal(uut.getAccessPermissions(users[1], uint(uint160(users[1]))), NO_PERMISSIONS, "non member should not be able to read and write own metadata file");
    }

    function canAddMembers() public {
        Assert.ok(!uut.isMember(users[1]), "user1 is a member");
        Assert.ok(!uut.isMember(users[2]), "user2 is a member");
        Assert.ok(!uut.isMember(users[3]), "user3 is a member");
        address[] memory newMembers = new address[](2);
        newMembers[0] = users[1];
        newMembers[1] = users[2];
        uut.setMembers(newMembers, true);
        Assert.ok(uut.isMember(users[1]), "user1 is not a member");
        Assert.ok(uut.isMember(users[2]), "user2 is not a member");
        Assert.ok(!uut.isMember(users[3]), "user3 is a member");
    }

    function canRemoveMembers() public {
        Assert.ok(uut.isMember(users[1]), "user1 is not a member");
        Assert.ok(uut.isMember(users[2]), "user2 is not a member");
        Assert.ok(!uut.isMember(users[3]), "user3 is a member");
        address[] memory newMembers = new address[](2);
        newMembers[0] = users[1];
        newMembers[1] = users[2];
        uut.setMembers(newMembers, false);
        Assert.ok(!uut.isMember(users[1]), "user1 is a member");
        Assert.ok(!uut.isMember(users[2]), "user2 is a member");
        Assert.ok(!uut.isMember(users[3]), "user3 is a member");
    }

    function checkMemberAccess() public {
        address[] memory newMembers = new address[](2);
        newMembers[0] = users[1];
        newMembers[1] = users[2];
        uut.setMembers(newMembers, true);
        Assert.ok(uut.isMember(users[1]), "user1 is not a member");
        Assert.ok(uut.isMember(users[2]), "user2 is not a member");
        // root: r
        Assert.equal(uut.getAccessPermissions(users[1], ROOT), READ_BIT, "user should have read-only access to root");
        // metadata file: r
        Assert.equal(uut.getAccessPermissions(users[1], METADATA_FILE), READ_BIT, "user should have read-only access to metadata file");
        // shared file directory: drw
        Assert.equal(uut.getAccessPermissions(users[1], SHARED_FILE_DIR), DIRECTORY_BIT | READ_BIT | WRITE_BIT, "user should be able to rw shared directory");
        // messaging directory: dra
        Assert.equal(uut.getAccessPermissions(users[1], MESSAGING_DIR), DIRECTORY_BIT | READ_BIT | APPEND_BIT, "user should be able to ra messaging directory");
        // owner metadata file: -
        Assert.equal(uut.getAccessPermissions(users[1], uint(uint160(users[0]))), NO_PERMISSIONS, "user should not have access to the owner's metadata file");
        // own metadata file: rw
        Assert.equal(uut.getAccessPermissions(users[1], uint(uint160(users[1]))), READ_BIT | WRITE_BIT, "user should be able to read and write own metadata file");
        // other member's metadata file: -
        Assert.equal(uut.getAccessPermissions(users[1], uint(uint160(users[2]))), NO_PERMISSIONS, "user should not have access to another member's metadata file");
    }

    function checkOwnerCanReadMemberMetadataFile() public {
        Assert.ok(uut.isMember(users[1]), "user1 is not a member");
        Assert.equal(uut.getAccessPermissions(users[0], uint(uint160(users[1]))), WRITE_BIT, "owner should have write access to a member's metadata file");
    }

    function checkTerminatedVaultAccess() public {
        Assert.ok(!uut.isTerminated(), 'vault should not be terminated by default');
        uut.terminate();
        Assert.ok(uut.isTerminated(), 'vault should have been terminated');
        Assert.equal(uut.getAccessPermissions(users[0], ROOT), BUBBLE_TERMINATED_BIT, "getAccessPermissions should return the terminated bit");
    }

}