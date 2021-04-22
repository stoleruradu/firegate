import { CommanderStatic } from 'commander';
import { MigrationFileGenerator } from '../../lib/generator';
import * as assert from 'assert';
import { IGenerationOption } from '../../lib/types';

export function load(commander: CommanderStatic): void {
    commander.program
        .command('generate [name]')
        .option('-I, --irreversible', 'Create a irreversible migration.')
        .option('-C, --clone [timestamp]', 'Create a new migration from existing one.')
        .option('--path [path]', 'Path to migrations location.')
        .option('--tabs [tabsWidth]', 'Tabs width for indentation.')
        .option('--doubleQuote [doubleQuote]', 'Use double quotes instead of single quotes for imports.')
        .description('Create a new migration file.')
        .action((name: string, options: IGenerationOption) => void assert.ok(name, 'Name is required') || MigrationFileGenerator.generate(name, options));
}
