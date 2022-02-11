import chai from 'chai';
import Ganache from 'ganache';
import Web3 from 'web3';
import { compile } from './util.js';

const chaiAssert = chai.assert;

const web3 = new Web3(Ganache.provider());

let accounts;
let contract;

beforeEach(async () => {
    const { bytecode, abi } = compile('Lottery.sol');

    accounts = await web3.eth.getAccounts();

    contract = await new web3.eth.Contract(abi)
        .deploy({ data: bytecode, arguments: [] })
        .send({ from: accounts[0], gas: '1000000' });
});

describe('Lottery', () => {
    it('Deploys the Lottery contract', () => {
        chaiAssert.isOk(
            contract.options.address,
            'Contract does not have a valid address, not deployed',
        );
    });

    it('Checks if the contract deployer and manager are the same', async () => {
        const manager = await contract.methods.manager().call();
        chaiAssert.equal(
            manager,
            accounts[0],
            'Manager and deployer are not the same',
        );
    });

    it('Checks that manager cannot enter lottery', async () => {
        try {
            await web3.eth.sendTransaction({
                to: contract.options.address,
                from: accounts[0],
                value: web3.utils.toWei('0.1', 'ether'),
            });
            chaiAssert.fail();
        } catch (err) {
            chaiAssert.isNotEmpty(err, 'contract did not fail');
        }
    });

    it('Allows an account to enter the lottery', async () => {
        await web3.eth.sendTransaction({
            to: contract.options.address,
            from: accounts[1],
            value: web3.utils.toWei('0.1', 'ether'),
        });

        const players = await contract.methods.getPlayers().call();

        chaiAssert.equal(
            players[0],
            accounts[1],
            'Player is not in players array',
        );
        chaiAssert.equal(
            players.length,
            1,
            'Players does not have a length of 1',
        );
    });

    it('Checks for multiple accounts entry into the lottery', async () => {
        await web3.eth.sendTransaction({
            to: contract.options.address,
            from: accounts[1],
            value: web3.utils.toWei('0.1', 'ether'),
        });
        await web3.eth.sendTransaction({
            to: contract.options.address,
            from: accounts[2],
            value: web3.utils.toWei('0.1', 'ether'),
        });
        await web3.eth.sendTransaction({
            to: contract.options.address,
            from: accounts[3],
            value: web3.utils.toWei('0.1', 'ether'),
        });

        const players = await contract.methods.getPlayers().call();
        chaiAssert.equal(
            players[0],
            accounts[1],
            'Player is not in players array',
        );
        chaiAssert.equal(
            players[1],
            accounts[2],
            'Player is not in players array',
        );
        chaiAssert.equal(
            players[2],
            accounts[3],
            'Player is not in players array',
        );
        chaiAssert.equal(
            players.length,
            3,
            'Players does not have a length of 3',
        );
    });

    it('Checks to see if an error is thrown due to not enough wei sent', async () => {
        try {
            await web3.eth.sendTransaction({
                to: contract.options.address,
                from: accounts[0],
                value: web3.utils.toWei('0.01', 'ether'),
            });
            chaiAssert.fail();
        } catch (err) {
            chaiAssert.isNotEmpty(err, 'contract did not fail');
        }
    });

    it('Only manager can choose winner', async () => {
        try {
            await contract.methods.pickWinner().send({
                from: accounts[1],
            });
            chaiAssert.fail();
        } catch (err) {
            chaiAssert.isNotEmpty(err, 'contract did not fail');
        }
    });
    //use the accounts at the end as they haven't run through any test
    it('Runs through entire contract end to end', async () => {
        await web3.eth.sendTransaction({
            to: contract.options.address,
            from: accounts[7],
            value: web3.utils.toWei('0.1', 'ether'),
        });
        await web3.eth.sendTransaction({
            to: contract.options.address,
            from: accounts[8],
            value: web3.utils.toWei('0.1', 'ether'),
        });
        await web3.eth.sendTransaction({
            to: contract.options.address,
            from: accounts[9],
            value: web3.utils.toWei('0.1', 'ether'),
        });

        const manager = await contract.methods.manager().call();
        const players = await contract.methods.getPlayers().call();

        chaiAssert.equal(
            manager,
            accounts[0],
            'Manager and deployer are not the same',
        );
        chaiAssert.equal(
            players[0],
            accounts[7],
            'Player is not in players array',
        );
        chaiAssert.equal(
            players[1],
            accounts[8],
            'Player is not in players array',
        );
        chaiAssert.equal(
            players[2],
            accounts[9],
            'Player is not in players array',
        );
        chaiAssert.equal(
            players.length,
            3,
            'Players does not have a length of 3',
        );

        const playerAccounts = accounts.slice(-3);

        await Promise.all(
            playerAccounts.map(async (account) => {
                let balance = await web3.eth.getBalance(account); 
                balance = parseFloat(web3.utils.fromWei(balance, 'ether'));
                
                chaiAssert.isBelow(balance, 999.9, 'Entered accounts balance is too high ')
            }),
        );

        let randomInd = null;

        try {
            await contract.methods.pickWinner().send({
                from: accounts[0],
            });

            randomInd = await contract.methods.index().call();
        } catch (err) {
            chaiAssert.isNotEmpty(err, 'Contract through an error');
        }
        await Promise.all(
            players.map(async (player) => {
                let balance = await web3.eth.getBalance(player);
                //players[randomInd] is the lotto winner
                balance = parseFloat(web3.utils.fromWei(balance, 'ether'));
                if (player !== players[randomInd]) {
                    chaiAssert.isBelow(balance, 1000);
                } else if (player === players[randomInd]) {
                    chaiAssert.isAbove(balance, 1000);
                }
            }),
        );
    });
});
