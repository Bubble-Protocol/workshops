// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;
import "remix_tests.sol"; // this import is automatically injected by Remix.
import "hardhat/console.sol";
import { SharedVault } from "../contracts/SharedVault.sol";
import "https://github.com/Bubble-Protocol/bubble-sdk/blob/main/contracts/AccessControlBits.sol";


contract SharedVault_Permissions_Test {

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
        address[] memory members = new address[](2);
        members[0] = users[1];
        members[1] = users[2];
        uut.setMembers(members, true);
        Assert.ok(uut.isMember(users[1]), "user1 is not a member");
        Assert.ok(uut.isMember(users[2]), "user2 is not a member");
    }

    function checkDefaultAccess() public {
        // all: -
        uint UNCONTROLLED_FILE = 4;
        Assert.equal(uut.getAccessPermissions(users[0], UNCONTROLLED_FILE), NO_PERMISSIONS, "admin should not have access");
        Assert.equal(uut.getAccessPermissions(users[1], UNCONTROLLED_FILE), NO_PERMISSIONS, "member should not have access");
        Assert.equal(uut.getAccessPermissions(users[3], UNCONTROLLED_FILE), NO_PERMISSIONS, "non-member should not have access");
    }

    function checkRootAccess() public {
        // admin: rw, member: r
        Assert.equal(uut.getAccessPermissions(users[0], ROOT), READ_BIT | WRITE_BIT, "admin should have rw access");
        Assert.equal(uut.getAccessPermissions(users[1], ROOT), READ_BIT, "member should have read-only access");
        Assert.equal(uut.getAccessPermissions(users[3], ROOT), NO_PERMISSIONS, "non-member should not have access");
    }

    function checkGlobalMetadataAccess() public {
        // admin: rw, member: r
        Assert.equal(uut.getAccessPermissions(users[0], METADATA_FILE), READ_BIT | WRITE_BIT, "admin should have rw access");
        Assert.equal(uut.getAccessPermissions(users[1], METADATA_FILE), READ_BIT, "member should have read-only access");
        Assert.equal(uut.getAccessPermissions(users[3], METADATA_FILE), NO_PERMISSIONS, "non-member should not have access");
    }

    function checkSharedFilesDirectoryAccess() public {
        // all: drw
        Assert.equal(uut.getAccessPermissions(users[0], SHARED_FILE_DIR), DIRECTORY_BIT | READ_BIT | WRITE_BIT, "admin should have rw access");
        Assert.equal(uut.getAccessPermissions(users[1], SHARED_FILE_DIR), DIRECTORY_BIT | READ_BIT | WRITE_BIT, "member should have rw access");
        Assert.equal(uut.getAccessPermissions(users[3], SHARED_FILE_DIR), NO_PERMISSIONS, "non-member should not have access");
    }

    function checkMessagingDirectoryAccess() public {
        // all: dra
        Assert.equal(uut.getAccessPermissions(users[0], MESSAGING_DIR), DIRECTORY_BIT | READ_BIT | APPEND_BIT, "admin should have ra access");
        Assert.equal(uut.getAccessPermissions(users[1], MESSAGING_DIR), DIRECTORY_BIT | READ_BIT | APPEND_BIT, "member should have ra access");
        Assert.equal(uut.getAccessPermissions(users[3], MESSAGING_DIR), NO_PERMISSIONS, "non-member should not have access");
    }

    function checkTerminatedVaultAccess() public {
        Assert.ok(uut.getAccessPermissions(users[0], ROOT) & BUBBLE_TERMINATED_BIT == 0, "vault should not be terminated");
        uut.terminate();
        Assert.ok(uut.getAccessPermissions(users[0], ROOT) & BUBBLE_TERMINATED_BIT > 0, "getAccessPermissions should return the terminated bit when the contract has been terminated");
    }

}