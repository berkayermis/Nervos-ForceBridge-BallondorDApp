/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import { ToastContainer, toast } from 'react-toastify';
import './app.scss';
import 'react-toastify/dist/ReactToastify.css';
import { PolyjuiceHttpProvider } from '@polyjuice-provider/web3';
import { BallondorWrapper } from '../lib/contracts/BallondorWrapper';
import { CONFIG } from '../config';
import { AddressTranslator, BridgeRPCHandler } from 'nervos-godwoken-integration';
import * as CompiledContractArtifact from '../../build/contracts/ERC20.json';


interface Player {
    id: string;
    name: string;
    teamName: string;
    0: string;
    1: string;
    2: string;
}

async function createWeb3() {
    // Modern dapp browsers...
    if ((window as any).ethereum) {
        const godwokenRpcUrl = CONFIG.WEB3_PROVIDER_URL;
        const providerConfig = {
            rollupTypeHash: CONFIG.ROLLUP_TYPE_HASH,
            ethAccountLockCodeHash: CONFIG.ETH_ACCOUNT_LOCK_CODE_HASH,
            web3Url: godwokenRpcUrl
        };

        const provider = new PolyjuiceHttpProvider(godwokenRpcUrl, providerConfig);
        const web3 = new Web3(provider || Web3.givenProvider);

        try {
            // Request account access if needed
            await (window as any).ethereum.enable();
        } catch (error) {
            toast.error('You rejected to connect metamask');
        }

        return web3;
    }

    console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    return null;
}

export function App() {
    const [web3, setWeb3] = useState<Web3>(null);
    const [contract, setContract] = useState<BallondorWrapper>();
    const [accounts, setAccounts] = useState<string[]>();
    const [balance, setBalance] = useState<bigint>();
    const [existingContractIdInputValue, setExistingContractIdInputValue] = useState<string>();
    const [deployTxHash, setDeployTxHash] = useState<string | undefined>();
    const [polyjuiceAddress, setPolyjuiceAddress] = useState<string | undefined>();
    const [storedValue, setStoredValue] = useState<number | undefined>();
    const [transactionInProgress, setTransactionInProgress] = useState(false);
    const toastId = React.useRef(null);
    const [balanceOf, setBalanceOf] = useState<bigint>();
    const [depositAddress, setDepositAddress] = useState<string>('');
    const [playerCount, setPlayerCount] = useState<number>(0);
    const [playerName, setPlayerName] = useState<string | undefined>();
    const [playerTeamName, setPlayerTeamName] = useState<string | undefined>();
    const [playerId, setPlayerId] = useState<string>('');
    const [player, setPlayer] = useState<Player>();
    const [playerLoading, setPlayerLoading] = useState<boolean>(false);
    const [newStoredNumberInputValue, setNewStoredNumberInputValue] = useState<
        number | undefined
    >();

    useEffect(() => {
        if (accounts?.[0]) {
            const addressTranslator = new AddressTranslator();
            setPolyjuiceAddress(addressTranslator.ethAddressToGodwokenShortAddress(accounts?.[0]));
        } else {
            setPolyjuiceAddress(undefined);
        }
    }, [accounts?.[0]]);

    useEffect(() => {
        if (transactionInProgress && !toastId.current) {
            toastId.current = toast.info(
                'Transaction in progress. Confirm MetaMask signing dialog and please wait...',
                {
                    position: 'top-right',
                    autoClose: false,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    closeButton: false
                }
            );
        } else if (!transactionInProgress && toastId.current) {
            toast.dismiss(toastId.current);
            toastId.current = null;
        }
    }, [transactionInProgress, toastId.current]);

    const account = accounts?.[0];

    useEffect(() => {
        if (web3) {
            return;
        }

        (async () => {
            const _web3 = await createWeb3();
            setWeb3(_web3);

            const _accounts = [(window as any).ethereum.selectedAddress];
            setAccounts(_accounts);

            console.log({ _accounts });

            const _contract = new BallondorWrapper(_web3);
            console.log('CONTRACT::', _contract);
            setContract(_contract);
            
            // const playerCount = await _contract.playerCountFunction(account);
            // setPlayerCount(playerCount-1);
            if (_accounts && _accounts[0]) {
                const _l2Balance = BigInt(await _web3.eth.getBalance(_accounts?.[0]));
                setBalance(_l2Balance);
            }
        })();
    });

    async function deployContract() {
        const _contract = new BallondorWrapper(web3);
        
        try {
            setDeployTxHash(undefined);
            setTransactionInProgress(true);

            const transactionHash = await _contract.deploy(account);

            setDeployTxHash(transactionHash);
            setExistingContractAddress(_contract.address);
            toast(
                'Successfully deployed a smart-contract. You can now proceed in a smart contract.',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            setTransactionInProgress(false);
        }
    }

    async function getPlayer() {
        setPlayerLoading(true);

        const playerInfo = await contract.getPlayer(playerId,account);
        toast('Successfully read a new player.', { type: 'success' });
        setPlayer(playerInfo);
        setPlayerLoading(false);
    }

    async function getPlayerCount() {
        const _playerCount = await contract.playerCountFunction(account);
        setPlayerCount(_playerCount-1);
    }

    async function setExistingContractAddress(contractAddress: string) {
        const _contract = new BallondorWrapper(web3);
        _contract.useDeployed(contractAddress.trim());

        setContract(_contract);
        setStoredValue(undefined);
    }

    async function addNewPlayer() {
        try {
            setTransactionInProgress(true);
            await contract.addPlayer(playerName,playerTeamName, account);
            toast(
                'Successfully added a new football player.',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast('There was an error sending your transaction. Please check developer console.');
        } finally {
            setTransactionInProgress(false);
            setPlayerName('');
            setPlayerTeamName('');
            setPlayerCount(p => p + 1);

        }
    }

    async function removePlayer(){
        try {
            setTransactionInProgress(true);
            await contract.removePlayer(playerId, account);
            toast(
                'Successfully removed the football player.',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast('There was an error sending your transaction. Please check developer console.');
        } finally {
            setTransactionInProgress(false);
            setPlayerName('');
            setPlayerTeamName('');
            setPlayerCount(p => p - 1);
        }
    }

    async function updatePlayer(){
        try {
            setTransactionInProgress(true);
            await contract.updatePlayer(playerId,playerName,playerTeamName, account);
            toast(
                'Successfully updated the football player.',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast('There was an error sending your transaction. Please check developer console.');
        } finally {
            setTransactionInProgress(false);
            setPlayerName('');
            setPlayerTeamName('');
        }
    }

    const SUDT_PROXY_CONTRACT_ADDRESS = '0x22888DDb532f7FA82FDA53F48c59a59d9Ad5B912';

    const SUDTBalance = async () => {
        const contract = new web3.eth.Contract(
            CompiledContractArtifact.abi as any,
            SUDT_PROXY_CONTRACT_ADDRESS
        );

        const _balanceOf = await contract.methods.balanceOf(polyjuiceAddress).call({
            from: accounts?.[0]
        });
        console.log('BALANCE:', _balanceOf);
        setBalanceOf(_balanceOf);
    };

    console.log(`Polyjuice Address: ${polyjuiceAddress}\n`);


        const generateLayer2DepositAddress = async () => {
        setPlayerLoading(true);
        const addressTranslator = new AddressTranslator();
        const _depositAddress = await addressTranslator.getLayer2DepositAddress(
            web3,
            accounts?.[0]
        );

        console.log(`Layer 2 Deposit Address on Layer 1: \n${_depositAddress.addressString}`);

        setDepositAddress(_depositAddress.addressString);

        SUDTBalance();
        setPlayerLoading(false);
    };

    const FORCE_BRIDGE_URL = 'https://force-bridge-test.ckbapp.dev/bridge/Ethereum/Nervos?xchain-asset=0x0000000000000000000000000000000000000000';

        const redirectToBridge = () => {
        window.location.href = FORCE_BRIDGE_URL;
    };



    const LoadingIndicator = () => <span className="rotating-icon">⚙️</span>;

    return (
        <div>
            Your ETH address: <b>{accounts?.[0]}</b>
            <br />
            Polyjuice address: <b>{polyjuiceAddress || ' - '}</b>
            <br />
            <br />
            Balance: <b>{balance ? (balance / 10n ** 8n).toString() : <LoadingIndicator />} ETH</b>
            <br />
            <br />
            Deployed contract address: <b>{contract?.address || '-'}</b> <br />
            Deploy transaction hash: <b>{deployTxHash || '-'}</b>
            <br/>
            <h3>Number of Total Players: {playerCount}</h3>
            <hr />
            <p className="announcement">
                The button below will deploy a Ballondor smart contract where you can add a new candidate football player for Ballon D'or 
                competition, update them, and remove processes.
            </p>
            <button className="allButtons" onClick={deployContract}>
                Deploy contract
            </button>
            &nbsp;or&nbsp;
            <input
                placeholder="Existing contract id"
                onChange={e => setExistingContractIdInputValue(e.target.value)}
            />
            <button className="allButtons existButton"
                disabled={!existingContractIdInputValue || !balance}
                onClick={() => setExistingContractAddress(existingContractIdInputValue)}
            >
                Use existing contract
            </button>
            <br />
            <br />
            <hr />
            <br />
            <div>
            <input
                    placeholder="Player name"
                    onChange={e => setPlayerName(e.target.value)}
            />
            <input
                    placeholder="Player Team Name"
                    onChange={e => setPlayerTeamName(e.target.value)}
            />
                    <button className="allButtons" onClick={addNewPlayer}>Add</button>
                    </div>

                    <br /> <br />
                    <div>
                        <input
                        placeholder="Player ID"
                        onChange={e => setPlayerId(e.target.value)}
                        />
                                    <input
                    placeholder="Player name"
                    onChange={e => setPlayerName(e.target.value)}
                        />
                    <input
                            placeholder="Player Team Name"
                            onChange={e => setPlayerTeamName(e.target.value)}
                    />
                        <button className="allButtons" onClick={updatePlayer}>Update</button>

                    </div>

                    <br/>
                    <br/>
                    <input
                    placeholder="Player ID"
                    onChange={e => setPlayerId(e.target.value)}
            />
                    <button className="allButtons" onClick={removePlayer}>Remove</button>
                    <br/>
                    <br/>
                    <div>
                    {playerCount > 0 && (
                        <input
                            type="number"
                            onChange={e => setPlayerId(e.target.value)}
                        />
                    )}
                    <button className="allButtons" onClick={getPlayer}>
                        Get Player
                    </button>
                </div>

                <div>
                    {playerLoading ? (
                        <LoadingIndicator />
                    ) : (
                        player?.[1].length > 0 && (
                            <div>
                                <div>
                                    <p>
                                        Player Name: <strong>{player.name}</strong>
                                    </p>
                                </div>
                                <div>
                                    <p>
                                        Player Team Name: <strong>{player.teamName}</strong>
                                    </p>
                                </div>
                            </div>
                        )
                    )}
                </div>
            <br />
            <br />
            <hr />
            <h1 className="titleText">Nervos | Force-Bridge Part</h1>
            <div>
                {!depositAddress && (
                    <button className="allButtons" onClick={generateLayer2DepositAddress}>
                        Layer2 Deposit Address
                    </button>
                )}

                {playerLoading && <LoadingIndicator />}
                {!playerLoading && depositAddress && (
                    <div>
                        <div className="Info">
                            {' '}
                            <strong>User's Layer 2 Balance:</strong> {balanceOf}
                            <h4>Layer 2 Deposit Receiver Address </h4>
                            {depositAddress}
                        </div>
                         <br/>
                        <div>
                            <h4>Next Step</h4>
                            <div>
                                Copy your Layer 2 deposit receiver address and click the below button.{' '}
                            </div>
                            <br/>
                            <div>
                                <button className="allButtons" onClick={redirectToBridge}> Next</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        <ToastContainer />
        </div>
    );
}
