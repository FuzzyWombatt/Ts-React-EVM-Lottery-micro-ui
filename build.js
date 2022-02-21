import path, { dirname } from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import solc from 'solc';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const build = () => {
    const contractPath = path.join(__dirname, 'contract', 'Lottery.sol');
    const buildPath = path.resolve(__dirname, 'contract/build');

    const compilerInput = {
        language: 'Solidity',
        sources: {
            'Lottery.sol': { content: fs.readFileSync(contractPath, 'utf-8') },
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['abi', 'evm.bytecode.object', 'evm.bytecode.opcodes'],
                },
            },
        },
    };

    const compiled = JSON.parse(solc.compile(JSON.stringify(compilerInput)));

    if (!fs.existsSync(buildPath)) {
        fs.mkdirSync(buildPath, { recursive: true });
    }

    fs.outputJsonSync(
        path.resolve(buildPath, 'Lottery.json'),
        compiled
    );
}

build();