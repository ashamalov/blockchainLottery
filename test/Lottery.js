const { expect } = require("chai");
const { network } = require("hardhat");

describe("Lottery contract", function() {

    let Lottery;
    let lottery;
    let lotteryName;
    let startedBalance;
    let lotteryBalance;
    let curLotBalance;

    beforeEach(async function() {
        [this.owner, this.alice, this.bob] = await ethers.getSigners();

        Lottery = await ethers.getContractFactory("Lottery");

        lotteryName = "New Lottery";
        startedBalance = 1000;
            
        lottery = await Lottery.deploy({value: startedBalance});
        
        aliceName = "Alice";
        aliceAmount = startedBalance / 10; // 10% 
        aliceEntryCount = 1;

        bobName = "Bob";
        bobAmount = startedBalance / 10; // 10% 
        bobEntryCount = 1;
    });

    it("Should fail if lottery constructor require is not worked.", async function() {
        LotteryFailTest = await ethers.getContractFactory("Lottery");

        // Failure balance is too small.
        await expect(
            LotteryFailTest.deploy({value: 1, gasPrice: 0})
        ).to.be.revertedWith("Balance is too small.");
    }); 

    it("Should fail if lottery not started.", async function() {
        // Start check.
        expect(await lottery.manager()).to.equal(this.owner.address);
        lotteryBalance = await ethers.provider.getBalance(lottery.address);
        expect(lotteryBalance).to.equal(startedBalance);
        curLotBalance = startedBalance;
    });
        
    it("Should fail if sub methods is not worked.", async function() {
        // itsOverCheck check.
        lotteryBalance = await ethers.provider.getBalance(lottery.address);
        bobAmount = (lotteryBalance - lotteryBalance % 100) / 100 + 1; // Math for get integer value more that 1%.
        
        console.log(`lotteryBalance: ${lotteryBalance}`);
        
        await lottery.connect(this.bob).participate({value: bobAmount});

        let t_winnerPayAddress = await lottery.winnerPayAddress();
        let winnerBalanceBefore = await ethers.provider.getBalance(t_winnerPayAddress);

        await ethers.provider.send("evm_increaseTime", [3600]);

        lotteryBalance = await ethers.provider.getBalance(lottery.address);
        let balance10Percent = (lotteryBalance - lotteryBalance % 10) / 10; // Math for get integer value 10%
        let winningPrice = lotteryBalance - balance10Percent;

        await lottery.itsOverCheck();

        let winnerBalanceNow = await ethers.provider.getBalance(t_winnerPayAddress);
        let diff = winnerBalanceNow.sub(winnerBalanceBefore);
        expect(diff).to.equal(winningPrice);
    });

    it("Should fail if participate not worked.", async function() {
        // Set Alice is winner and check it.
        await lottery.connect(this.alice).participate({value: aliceAmount});

        lotteryBalance = await ethers.provider.getBalance(lottery.address);
        curLotBalance += aliceAmount; 
        expect(lotteryBalance).to.equal(curLotBalance);

        expect(await lottery.winnerPayAddress()).to.equal(this.alice.address); 

        // Set new winner - Bob and check it.
        await lottery.connect(this.bob).participate({value: bobAmount});
            
        expect(await lottery.winnerPayAddress()).to.equal(this.bob.address);

        lotteryBalance = await ethers.provider.getBalance(lottery.address);
        curLotBalance += bobAmount;
        expect(lotteryBalance).to.equal(curLotBalance); 

        // Check victory.
        let t_winnerPayAddress = await lottery.winnerPayAddress();
        let winnerBalanceBefore = await ethers.provider.getBalance(t_winnerPayAddress)

        await ethers.provider.send("evm_increaseTime", [3600]);

        lotteryBalance = await ethers.provider.getBalance(lottery.address);
        let more1Percent = (lotteryBalance - lotteryBalance % 100) / 100 + 1;
        let t_winningPrice = lotteryBalance - lotteryBalance / 10; // - more1Percent

        await lottery.connect(this.alice).participate({value: more1Percent, gasPrice: 0});

        let winnerBalanceNow = await ethers.provider.getBalance(t_winnerPayAddress);    
        let diff = winnerBalanceNow.sub(winnerBalanceBefore);
        expect(diff).to.equal(t_winningPrice);

        // Failure participate check < 1%.
        lotteryBalanceBefore = await ethers.provider.getBalance(lottery.address);
        let less1Percent = (lotteryBalanceBefore - lotteryBalanceBefore % 100) / 100 - 1; // Math for get integer value less 1%.
        await expect(
            lottery.connect(this.bob).participate({value: less1Percent})
        ).to.be.revertedWith("Deposit amount < 1% of contract balance.");
        lotteryBalanceNow = await ethers.provider.getBalance(lottery.address);

        expect(lotteryBalanceBefore).to.equal(lotteryBalanceNow);
        expect(await lottery.winnerPayAddress()).to.equal(this.alice.address);
    });

});
