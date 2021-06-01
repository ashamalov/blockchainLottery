const { expect } = require("chai");
const { network } = require("hardhat");

describe("Lottery contract", function() {

    let Lottery;
    let lottery;
    let lotteryName;
    let startedBalance;
    let lotteryBalance;
    let curLotBalance;

    let aliceName;
    let aliceAmount;
    let aliceEntryCount;

    let bobName;
    let bobAmount; 
    let bobEntryCount;

    let player;

    beforeEach(async function() {
        [this.owner, this.alice, this.bob] = await ethers.getSigners();

        Lottery = await ethers.getContractFactory("Lottery");

        lotteryName = "New Lottery";
        startedBalance = 1000;
            
        lottery = await Lottery.deploy(lotteryName, {value: startedBalance});
        
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
            LotteryFailTest.deploy("TestName", {value: 1, gasPrice: 0})
        ).to.be.revertedWith("Balance is too small.");

        // Failure player name is not valid.
        await expect(
            LotteryFailTest.deploy("", {value: 100})
        ).to.be.revertedWith("Player name is not valid.");
    }); 

    it("Should fail if lottery not started.", async function() {
        // Start check.
        expect(await lottery.lotteryName()).to.equal(lotteryName);
        expect(await lottery.manager()).to.equal(this.owner.address);
        lotteryBalance = await ethers.provider.getBalance(lottery.address);
        expect(lotteryBalance).to.equal(startedBalance);
        curLotBalance = startedBalance;
    });
        
    it("Should fail if sub methods is not worked.", async function() {
        // getPlayer check.
        lotteryBalance = await ethers.provider.getBalance(lottery.address);
        bobAmount = (lotteryBalance - lotteryBalance % 100) / 100 + 1; // Math for get integer value more that 1%.

        await lottery.connect(this.bob).participate(bobName, {value: bobAmount});
        player = await lottery.getPlayer(this.bob.address); 
        expect(player[0]).to.equal(bobName);
        expect(player[1]).to.equal(bobAmount); 
        expect(player[2]).to.equal(bobEntryCount);

        player = await lottery.getPlayer(this.alice.address);
        expect(player[0]).to.equal("");
        expect(player[1]).to.equal(0); 
        expect(player[2]).to.equal(0);

        // itsOverCheck check.
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

        // itsOverCheck check closed.
        let LotteryCloseTest = await ethers.getContractFactory("Lottery");
        let lotteryCloseTest = await LotteryCloseTest.deploy("LotteryCloseTestName", {value: 100, gasPrice: 100});

        lotteryBalance = await ethers.provider.getBalance(lotteryCloseTest.address);
        let more1Percent = (lotteryBalance - lotteryBalance % 100) / 100 + 1;
        lotteryCloseTest.connect(this.bob).participate(bobName, {value: more1Percent});
                   
        await ethers.provider.send("evm_increaseTime", [3600]);
        await lotteryCloseTest.itsOverCheck();

        lotteryBalance = await ethers.provider.getBalance(lotteryCloseTest.address);

        await ethers.provider.send("evm_increaseTime", [3600]);
        await lotteryCloseTest.itsOverCheck();

        expect(await lotteryCloseTest.lotteryState()).to.equal(1);
    });

    it("Should fail if participate not worked.", async function() {
        // Set Alice is winner and check it.
        await lottery.connect(this.alice).participate(aliceName, {value: aliceAmount});

        lotteryBalance = await ethers.provider.getBalance(lottery.address);
        curLotBalance += aliceAmount; 
        expect(lotteryBalance).to.equal(curLotBalance);

        expect(await lottery.winnerPayAddress()).to.equal(this.alice.address);

        player = await lottery.getPlayer(this.alice.address); 
        expect(player[0]).to.equal(aliceName);
        expect(player[1]).to.equal(aliceAmount);
        expect(player[2]).to.equal(aliceEntryCount);

        // Set new winner - Bob and check it.
        await lottery.connect(this.bob).participate(bobName, {value: bobAmount});
            
        expect(await lottery.winnerPayAddress()).to.equal(this.bob.address);

        lotteryBalance = await ethers.provider.getBalance(lottery.address);
        curLotBalance += bobAmount;
        expect(lotteryBalance).to.equal(curLotBalance); 

        player = await lottery.getPlayer(this.bob.address); 
        expect(player[0]).to.equal(bobName);
        expect(player[1]).to.equal(bobAmount); 
        expect(player[2]).to.equal(bobEntryCount);

        // Check name, entryCount and amount update.
        let newAliceName = "New Alice";
        let AmountToAdd = (lotteryBalance - lotteryBalance % 10) / 10; // Math for get integer value.
        aliceAmount += AmountToAdd; 
        aliceEntryCount += 1;
        curLotBalance += AmountToAdd;

        await lottery.connect(this.alice).participate(newAliceName, {value: AmountToAdd});

        player = await lottery.getPlayer(this.alice.address);
        expect(player[0]).to.equal(newAliceName);
        expect(player[1]).to.equal(aliceAmount); 
        expect(player[2]).to.equal(aliceEntryCount);

        aliceName = newAliceName;

        // Check victory.
        let t_winnerPayAddress = await lottery.winnerPayAddress();

        let winnerBalanceBefore = await ethers.provider.getBalance(t_winnerPayAddress)

        await ethers.provider.send("evm_increaseTime", [3600]);

        lotteryBalance = await ethers.provider.getBalance(lottery.address);
        let more1Percent = (lotteryBalance - lotteryBalance % 100) / 100 + 1;
        let t_winningPrice = lotteryBalance - lotteryBalance / 10 - more1Percent;

        await lottery.connect(this.alice).participate(newAliceName, {value: more1Percent, gasPrice: 0});

        let winnerBalanceNow = await ethers.provider.getBalance(t_winnerPayAddress);
            
        let diff = winnerBalanceNow.sub(winnerBalanceBefore);
        expect(diff).to.equal(t_winningPrice);
            
        // Failure length > 0
        let lotteryBalanceBefore = await ethers.provider.getBalance(lottery.address);
        await expect(
            lottery.connect(this.bob).participate("")
        ).to.be.revertedWith("Player name is not valid.");
        let lotteryBalanceNow = await ethers.provider.getBalance(lottery.address);

        expect(lotteryBalanceBefore).to.equal(lotteryBalanceNow);

        expect(await lottery.winnerPayAddress()).to.equal(this.alice.address);

        // Failure participate check lotteryState.
        let LotteryCloseTest = await ethers.getContractFactory("Lottery");
        let lotteryCloseTest = await LotteryCloseTest.deploy("LotteryCloseTestName", {value: 100, gasPrice: 100});

        lotteryBalance = await ethers.provider.getBalance(lotteryCloseTest.address);
        more1Percent = (lotteryBalance - lotteryBalance % 100) / 100 + 1;
        lotteryCloseTest.connect(this.bob).participate(bobName, {value: more1Percent});
                   
        await ethers.provider.send("evm_increaseTime", [3600]);
        await lotteryCloseTest.itsOverCheck();

        lotteryBalance = await ethers.provider.getBalance(lotteryCloseTest.address);

        await ethers.provider.send("evm_increaseTime", [3600]);
        await lotteryCloseTest.itsOverCheck();

        lotteryBalance = await ethers.provider.getBalance(lotteryCloseTest.address);
        more1Percent = (lotteryBalance - lotteryBalance % 100) / 100 + 1;
        expect(await lotteryCloseTest.lotteryState()).to.equal(1);
        await expect(
            lotteryCloseTest.connect(this.bob).participate(bobName, {value: more1Percent})
        ).to.be.revertedWith("Lottery is closed.");    

        // Failure participate check < 1%.
        lotteryBalanceBefore = await ethers.provider.getBalance(lottery.address);
        let less1Percent = (lotteryBalanceBefore - lotteryBalanceBefore % 100) / 100 - 1; // Math for get integer value less 1%.
        await expect(
            lottery.connect(this.bob).participate(bobName, {value: less1Percent})
        ).to.be.revertedWith("Deposit amount < 1% of contract balance.");
        lotteryBalanceNow = await ethers.provider.getBalance(lottery.address);

        expect(lotteryBalanceBefore).to.equal(lotteryBalanceNow);

        expect(await lottery.winnerPayAddress()).to.equal(this.alice.address);

        player = await lottery.getPlayer(this.bob.address); 
        expect(player[0]).to.equal(bobName);
        expect(player[1]).to.equal(bobAmount);
        expect(player[2]).to.equal(bobEntryCount);
    });
});