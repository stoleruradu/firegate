import { CommanderStatic, Option } from 'commander';
import { MigrationGenerator } from '../../generator';
import { GenerateOptions } from '../../types';

export function load(commander: CommanderStatic, packageName: string): void {
    commander.program
        .command('generate <name>')
        .description('Create a new migration file')
        .option('-I, --irreversible', 'create an irreversible migration')
        .option(
            '-C, --clone <name>',
            'create a new migration from existing one',
        )
        .option(
            '--path [path]',
            'path to migrations location (default: migrations)',
        )
        .option('--tabs [number]', 'tabs width for indentation')
        .option(
            '--doubleQuote',
            'use double quotes instead of single quotes for imports',
        )
        .addOption(
            new Option(
                '--ext [extension]',
                'migration extension type',
            ).choices(['js', 'ts']),
        )
        .action((name: string, options: GenerateOptions) =>
            MigrationGenerator.create(options, packageName).generate(name),
        );
}
