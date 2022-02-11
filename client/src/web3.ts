import Web3 from 'web3';
//extends global Window interface
declare global {
    interface Window {
        web3:any;
    }
}

const web3 = new Web3(window.web3.currentProvider);

export default web3;