import * as Commander from 'commander';
import * as CommandLoader from './loader';

void (function main(): void {
    Commander.program
        .version(require('../package.json').version, '-v, --version', 'Output the current version.')
        .usage('<command> [options]')
        .helpOption('-h, --help', 'Output usage information.');

    CommandLoader.load(Commander);
    Commander.program.parse(process.argv);

    if (!process.argv.slice(2).length) {
        Commander.program.outputHelp();
    }
})();
