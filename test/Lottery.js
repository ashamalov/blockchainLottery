const { expect } = require("chai");
const { network } = require("hardhat");

//contract('CurrencyContract', accounts => {

    // TODO:
    // ПРОТЕСТИТЬ ВСЕ require и if

    describe("Lottery contract", function() {

        let owner; 
        let alice; 
        let bob;
        let Lottery;
        let lottery;
        let lotteryName;
        let startedBalance;
        let lotteryBalance;
        let t_curLotBalance;

        let aliceName = "Alice";
        let t_aliceAmount = startedBalance / 10; // 10% 
        let t_aliceEntryCount = 1;

        let bobName = "Bob";
        let t_bobAmount = startedBalance / 10; // 10% 
        let t_bobEntryCount = 1;

        let player;

        beforeEach(async function() {
            [this.owner, this.alice, this.bob] = await ethers.getSigners();

            Lottery = await ethers.getContractFactory("Lottery");

            lotteryName = "New Lottery";
            startedBalance = 1000;
            
            lottery = await Lottery.deploy(lotteryName, {value: startedBalance});
        
            aliceName = "Alice";
            t_aliceAmount = startedBalance / 10; // 10% 
            t_aliceEntryCount = 1;

            bobName = "Bob";
            t_bobAmount = startedBalance / 10; // 10% 
            t_bobEntryCount = 1;
        });

        it("Should fail if lottery not started.", async function() {
            expect(await lottery.lotteryName()).to.equal(lotteryName);
            expect(await lottery.manager()).to.equal(this.owner.address);
            lotteryBalance = await ethers.provider.getBalance(lottery.address);
            expect(lotteryBalance).to.equal(startedBalance);
            t_curLotBalance = startedBalance;
        }); 

        it("Should fail if participate not worked.", async function() {
            // Set Alice is winner and check it.
            await lottery.connect(this.alice).participate(aliceName, {value: t_aliceAmount});

            lotteryBalance = await ethers.provider.getBalance(lottery.address);
            t_curLotBalance += t_aliceAmount; 
            expect(lotteryBalance).to.equal(t_curLotBalance);

            expect(await lottery.winnerPayAddress()).to.equal(this.alice.address);

            player = await lottery.getPlayer(this.alice.address); 
            expect(player[0]).to.equal(aliceName);
            expect(player[1]).to.equal(t_aliceAmount);
            expect(player[2]).to.equal(t_aliceEntryCount);

            // Set new winner - Bob and check it.
            await lottery.connect(this.bob).participate(bobName, {value: t_bobAmount});
            
            expect(await lottery.winnerPayAddress()).to.equal(this.bob.address);

            lotteryBalance = await ethers.provider.getBalance(lottery.address);
            t_curLotBalance += t_bobAmount;
            expect(lotteryBalance).to.equal(t_curLotBalance); 

            player = await lottery.getPlayer(this.bob.address); 
            expect(player[0]).to.equal(bobName);
            expect(player[1]).to.equal(t_bobAmount); 
            expect(player[2]).to.equal(t_bobEntryCount);

            // Check name, entryCount and amount update.
            let newAliceName = "New Alice";
            let AmountToAdd = (lotteryBalance - lotteryBalance % 10) / 10; // Math for get integer value.
            t_aliceAmount += AmountToAdd; 
            t_aliceEntryCount += 1;
            t_curLotBalance += AmountToAdd;

            await lottery.connect(this.alice).participate(newAliceName, {value: AmountToAdd});

            player = await lottery.getPlayer(this.alice.address);
            expect(player[0]).to.equal(newAliceName);
            expect(player[1]).to.equal(t_aliceAmount); 
            expect(player[2]).to.equal(t_aliceEntryCount);

            aliceName = newAliceName;

            // Check victory.
            let t_winnerPayAddress = await lottery.winnerPayAddress();
            lotteryBalance = await ethers.provider.getBalance(lottery.address);

            let winnerBalanceBefore = await ethers.provider.getBalance(t_winnerPayAddress);

            let t_winningPrice = lotteryBalance - lotteryBalance / 10;

            await ethers.provider.send("evm_increaseTime", [3600]);

            await lottery.connect(this.alice).participate(newAliceName, {value: 200, gasPrice: 0});

            let winnerBalanceNow = await ethers.provider.getBalance(t_winnerPayAddress);
            
            let diff = winnerBalanceNow.sub(winnerBalanceBefore);

            console.log(`diff: ${diff}`)
            // expect(diff).to.equal(t_winningPrice);
            
            // Failure length > 0
            // let lotteryBalanceBefore = await ethers.provider.getBalance(lottery.address);
            // await expect(
            //     lottery.connect(this.bob).participate("")
            // ).to.be.revertedWith("Player name is not valid.");
            // let lotteryBalanceNow = await ethers.provider.getBalance(lottery.address);

            // expect(lotteryBalanceBefore).to.equal(lotteryBalanceNow);

            // expect(await lottery.winnerPayAddress()).to.equal(this.alice.address);

            // 
            //await lottery.lotteryState(1);
            // console.log(`Lottery state: `, await lottery.OPEN());

            // await lottery.lotteryState(lottery.LOTTERY_STATE.OPEN());


            // Failure participate check < 1%.
            // lotteryBalanceBefore = await ethers.provider.getBalance(lottery.address);
            // let less1Percent = (lotteryBalanceBefore - lotteryBalanceBefore % 100) / 100 - 1; // Math for get integer value less 1%.
            // await expect(
            //     lottery.connect(this.bob).participate(bobName, {value: less1Percent})
            // ).to.be.revertedWith("Deposit amount < 1% of contract balance.");
            // lotteryBalanceNow = await ethers.provider.getBalance(lottery.address);

            // expect(lotteryBalanceBefore).to.equal(lotteryBalanceNow);

            // expect(await lottery.winnerPayAddress()).to.equal(this.alice.address);

            // player = await lottery.getPlayer(this.bob.address); 
            // expect(player[0]).to.equal(bobName);
            // expect(player[1]).to.equal(t_bobAmount);
            // expect(player[2]).to.equal(t_bobEntryCount);
        });

        // it("Should fail if sub methods is not worked.", async function() {
        //     // getPlayer check.
        //     t_bobAmount = (lotteryBalance - lotteryBalance % 100) / 100 + 1; // Math for get integer value more that 1%.
        //     await lottery.connect(this.bob).participate(bobName, {value: t_bobAmount});
        //     player = await lottery.getPlayer(this.bob.address); 
        //     expect(player[0]).to.equal(bobName);
        //     expect(player[1]).to.equal(t_bobAmount); 
        //     expect(player[2]).to.equal(t_bobEntryCount);

        //     player = await lottery.getPlayer(this.alice.address);
        //     expect(player[0]).to.equal("");
        //     expect(player[1]).to.equal(0); 
        //     expect(player[2]).to.equal(0);

        //     // itsOverCheck check.
        //     //await lottery.itsOverCheck(this.bob.address); 
        // });
    });
//});