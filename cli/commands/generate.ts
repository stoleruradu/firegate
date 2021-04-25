import { CommanderStatic, Option } from 'commander';
import { IGenerationOption } from '../../lib/types';
import { MigrationGenerator } from '../../lib/generator';

export function load(commander: CommanderStatic): void {
    commander.program
        .command('generate <name>')
        .description('Create a new migration file')
        .option('-I, --irreversible', 'create an irreversible migration')
        .option('-C, --clone <name>', 'create a new migration from existing one')
        .option('--path <path>', 'path to migrations location (default: migrations)')
        .option('--tabs <number>', 'tabs width for indentation (default: migrations)')
        .option('--doubleQuote', 'use double quotes instead of single quotes for imports')
        .addOption(new Option('--ext [extension]', 'migration extension type').choices(['js', 'ts']))
        .action((name: string, options: IGenerationOption) => void MigrationGenerator.create(options).generate(name));
}
