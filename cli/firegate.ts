import 'ts-node/register';
import * as Commander from 'commander';
import * as CommandLoader from './loader';

void (function main(args: string[]): void {
    Commander.program
        .version(require('../package.json').version, '-v, --version', 'output the current version')
        .usage('<command> [options]')
        .helpOption('-h, --help', 'output usage information');

    CommandLoader.load(Commander);
    Commander.program.parse(args);

    if (!args.slice(2).length) {
        Commander.program.outputHelp();
    }
})(process.argv);
