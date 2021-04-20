#!/usr/bin/env node
import * as Commander from 'commander';
import * as CommandLoader from '../cli/command-loader';
import { PACKAGE_VERSION } from '../lib/constants';

void (function main(): void {
    Commander.program
        .version(PACKAGE_VERSION, '-v, --version', 'Output the current version.')
        .usage('<command> [options]')
        .helpOption('-h, --help', 'Output usage information.');

    CommandLoader.load(Commander);
    Commander.program.parse(process.argv);

    if (!process.argv.slice(2).length) {
        Commander.program.outputHelp();
    }
})();
