//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract Ballondor {

  struct player {
    uint id;
    string name;
    string teamName;
  }

  mapping(uint => player) public players;
  // player[] public players;
  uint public nextId = 0;

  function add(string memory name,string memory teamName) public {
    // players.push(player(nextId, name, teamName));
    players[nextId] = player(nextId, name, teamName);
    nextId++;
  }

  function update(uint idd, string memory name, string memory teamName) public {
    // uint i = find(id);
    // players[i].name = name;
    // players[i].teamName = teamName;
    players[idd].name = name;
    players[idd].teamName = teamName;
  }

  function remove(uint id) public {
    // uint i = find(id);
    delete players[id];
  }

  // function find(uint id) view internal returns(uint) {
  //   for(uint i = 0; i < players.length; i++) {
  //     if(players[i].id == id) {
  //       return i;
  //     }
  //   }
  //   revert('User does not exist!');
  // }

    function read(uint id) view public returns(player memory) {
    // uint i = find(id);
    return(players[id]);
  }

}