import path, { dirname } from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import solc from 'solc';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const compile = (contract) => {
    const contractPath = path.join(__dirname, '../', contract);

    const compilerInput = {
        language: 'Solidity',
        sources: {
            [contract]: { content: fs.readFileSync(contractPath, 'utf-8') },
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['abi', 'evm.bytecode.object'],
                },
            },
        },
    };
    const contractKey = path.parse(contract).name;

    const compiledContract = JSON.parse(solc.compile(JSON.stringify(compilerInput))).contracts[contract][contractKey];

    const {
        evm: {
            bytecode: { object: bytecode },
        },
        abi,
    } = compiledContract;

    return { bytecode, abi };
};
