const { expect } = require("chai");
const { network } = require("hardhat");

describe("Lottery contract", function() {
    it("Should fail if lottery not started.", async function() {
        const [owner, addr1, addr2] = await ethers.getSigners();

        const Lottery = await ethers.getContractFactory("Lottery");

        const lotteryName = "New Lottery";
        const startedValue = 1000;
        const lottery = await Lottery.deploy(lotteryName, {value:startedValue});
        expect(await lottery.lotteryName()).to.equal(lotteryName);
        expect(await lottery.manager()).to.equal(owner.address);

        const lotteryBalance = await ethers.provider.getBalance(lottery.address);
        console.log(`lottery balance: ${lotteryBalance}`)
    });
});