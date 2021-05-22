pragma solidity ^0.7.3;

import "hardhat/console.sol";

contract Lottery {
    string public lotteryName;
    address payable public manager;

    enum LOTTERY_STATE { OPEN, CLOSED }
    LOTTERY_STATE public lotteryState;

    struct Player {
        string name;
        uint256 amount; // It is also a parameter for checks
        uint256 entryCount;
    }
    mapping(address => Player) public players; // public for getList()

    Player public winner;
    address payable public winnerPayAddress; 

    uint256 public lastTimeMark; 
    uint256 public duration = 1 hours; 

    constructor(string memory name) payable { // calldata
        // require((msg.value / 100) * 100 == msg.value, 'Too small'); 
        manager = msg.sender;
        lotteryName = name;
        console.log("Lottery is started. Lottery name is %s.", lotteryName);
        lastTimeMark = block.timestamp;
        console.log("Timestamp update, new timestamp %s, expected completion time %s.", lastTimeMark, lastTimeMark + duration);
        console.log("New balance = %s.", address(this).balance);
        lotteryState = LOTTERY_STATE.OPEN;
    }

    function participate(string memory playerName) public payable {
        require(bytes(playerName).length > 0); // err message  
        
        itsOverCheck(); 

        require(lotteryState == LOTTERY_STATE.OPEN);
        require(msg.value >= address(this).balance / 100);

        console.log("New participate is active. New balance = %s.", address(this).balance);    
        lastTimeMark = block.timestamp;        
        console.log("Timestamp update, new timestamp %s, expected completion time %s.", lastTimeMark, lastTimeMark + duration);

        if (isNewPlayer(msg.sender)) {
            players[msg.sender].name = playerName;
            console.log("New player %s entered, amount = %s.", players[msg.sender].name, players[msg.sender].amount);
        } else {
            if (keccak256(abi.encodePacked(players[msg.sender].name)) != keccak256(abi.encodePacked(playerName))) {
                console.log("Player changed name %s to %s.", players[msg.sender].name, playerName);
                players[msg.sender].name = playerName;
            }
            console.log("Player %s added %s, amount = .", players[msg.sender].name, msg.value, players[msg.sender].amount);
        }

        players[msg.sender].amount += msg.value;
        players[msg.sender].entryCount += 1;

        winner = players[msg.sender];
        winnerPayAddress = msg.sender;
        console.log("New possible winner is %s.", winner.name);
    }

    function itsOverCheck() public { 
        if (block.timestamp - lastTimeMark >= duration) {
            declareWinner();
            lastTimeMark = block.timestamp;        
        }
        if ((address(this).balance / 100) * 100 != address(this).balance) { // del
            lotteryState = LOTTERY_STATE.CLOSED;
            console.log("Lottery %s is closed.", lotteryName);
            manager.transfer(address(this).balance);
        }
    }

    function declareWinner() private {
        console.log("Winer is %s, gets %s.", winner.name, getWinningPrice());
        if (winner.amount != 0)
        { 
            winnerPayAddress.transfer(getWinningPrice());
        }
        console.log("New balance = %s.", address(this).balance); 
        winner.amount = 0;
    }

    function getWinningPrice() public view returns (uint) { 
        return address(this).balance - address(this).balance / 10;
    }

    function isNewPlayer(address playerAddress) private view returns (bool) {
        return (players[playerAddress].amount != 0);
    }

    function getPlayer(address playerAddress) public view returns (string memory, uint256, uint256) {
        if (isNewPlayer(playerAddress)) {
            return ("", 0, 0);
        }
        return (players[playerAddress].name, players[playerAddress].amount, players[playerAddress].entryCount);
    }
}