import Web3 from 'web3';
import * as BallondorJSON from '../../../build/contracts/Ballondor.json';
import { Ballondor } from '../../types/Ballondor';

const DEFAULT_SEND_OPTIONS = {
    gas: 6000000
};

export class BallondorWrapper {
    web3: Web3;

    contract: Ballondor;

    address: string;

    constructor(web3: Web3) {
        this.web3 = web3;
        // this.address = '0x3a89CA5391fadaD73881f85988Ed82989CFe3Cd3';
        this.contract = new web3.eth.Contract(BallondorJSON.abi as any) as any;
        // this.contract.options.address = '0x3a89CA5391fadaD73881f85988Ed82989CFe3Cd3';
    }

    get isDeployed() {
        return Boolean(this.address);
    }

    async getPlayer(id:string,fromAddress: string) {
        const playerId = parseInt(id,10);
        const data = await this.contract.methods
        .players(playerId)
        .call({ from: fromAddress });

        return data;
    }

    // async players(fromAddress: string) {
    //     const data = await this.contract.methods.players.call({ from: fromAddress });

    //     return parseInt(data, 10);
    // }

    async playerCountFunction(fromAddress: string) {
        const data = await this.contract.methods.nextId().call({ from: fromAddress });

        return parseInt(data, 10);
    }

    async addPlayer(name: string,teamName: string, fromAddress: string) {
        const tx = await this.contract.methods
            .add(name,teamName)
            .send({ ...DEFAULT_SEND_OPTIONS, from: fromAddress });

        return tx;
    }

    async updatePlayer(id: string,name: string,teamName:string, fromAddress: string) {
        const playerId = parseInt(id, 10);
        const tx = await this.contract.methods
            .update(playerId,name,teamName)
            .send({ ...DEFAULT_SEND_OPTIONS, from: fromAddress });

        return tx;
    }

    async removePlayer(id: string, fromAddress: string) {
        const playerId = parseInt(id, 10);
        const tx = await this.contract.methods
            .remove(playerId)
            .send({ ...DEFAULT_SEND_OPTIONS, from: fromAddress });

        return tx;
    }

    async deploy(fromAddress: string) {
        const deployTx = await (this.contract
            .deploy({
                data: BallondorJSON.bytecode,
                arguments: []
            })
            .send({
                ...DEFAULT_SEND_OPTIONS,
                from: fromAddress,
                to: '0x0000000000000000000000000000000000000000'
            } as any) as any);

        this.useDeployed(deployTx.contractAddress);

        return deployTx.transactionHash;
    }

    useDeployed(contractAddress: string) {
        this.address = contractAddress;
        this.contract.options.address = contractAddress;
    }
}
