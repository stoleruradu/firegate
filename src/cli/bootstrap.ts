import Commander from 'commander';
import * as GenerateCommand from './commands/generate';
import * as RevertCommand from './commands/revert';
import * as RunCommand from './commands/run';
import * as ListCommand from './commands/list';

export type BootstrapConfig = {
    readonly version: string;
    readonly name: string;
};

export function bootstrap({ version, name }: BootstrapConfig): void {
    Commander.program
        .name(name)
        .version(version, '-v, --version', 'output the current version')
        .usage('<command> [options]')
        .helpOption('-h, --help', 'output usage information');

    GenerateCommand.load(Commander, name);
    RevertCommand.load(Commander);
    RunCommand.load(Commander);
    ListCommand.load(Commander);

    Commander.program.parse(process.argv);

    if (!process.argv.slice(2).length) {
        Commander.program.outputHelp();
    }
}
