// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;
import "remix_tests.sol"; // this import is automatically injected by Remix.
import "hardhat/console.sol";
import { SharedVault } from "../SharedVault.sol";


contract SharedVault_Logic_Test {

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

}