pragma solidity ^0.7.3;

import "hardhat/console.sol";

contract Lottery {
    string public lotteryName;
    address payable public manager;

    uint256 winningPrice; 
    address payable public winnerPayAddress;

    uint256 public lastTimeMark; 
    uint256 public duration = 1 hours; 

    constructor() payable {
        require(msg.value / 100 != 0, 'Balance is too small.');
        manager = msg.sender;
        lastTimeMark = block.timestamp;
        console.log("Lottery is started.");
        console.log("Timestamp update, new timestamp %s, expected completion time %s.", lastTimeMark, lastTimeMark + duration);
        console.log("New balance = %s.", address(this).balance);
    }

    function participate() public payable { 
        require(msg.value >= address(this).balance / 100, "Deposit amount < 1% of contract balance.");
        itsOverCheck(); 

        winningPrice = address(this).balance - address(this).balance / 10;

        console.log("New participate is active. New balance = %s.", address(this).balance);    
        lastTimeMark = block.timestamp;        
        console.log("Timestamp update, new timestamp %s, expected completion time %s.", lastTimeMark, lastTimeMark + duration);

        winnerPayAddress = msg.sender;
        console.log("New possible winner address is %s.", winnerPayAddress);
    }

    function itsOverCheck() public { 
        if (block.timestamp - lastTimeMark >= duration) {
            declareWinner();
            lastTimeMark = block.timestamp;        
        }
    }

    function declareWinner() private {
        console.log("Winer is %s.", winnerPayAddress);
        // if (winnerPayAddress != 0)
        // { 
            winnerPayAddress.transfer(winningPrice);
        // }
        console.log("New balance = %s.", address(this).balance); 
        // winnerPayAddress = 0;
    }
}
