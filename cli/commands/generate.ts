import { CommanderStatic } from 'commander';
import { MigrationFileGenerator } from '../../lib/generator';
import * as assert from 'assert';
import { IGenerationOption } from '../../lib/types';

export function load(commander: CommanderStatic): void {
    commander.program
        .command('generate [name]')
        .description('Create a new migration file')
        .option('-I, --irreversible', 'create an irreversible migration')
        .option('-C, --clone [name]', 'create a new migration from existing one')
        .option('--path [path]', 'path to migrations location (default: migrations)')
        .option('--tabs [tabsWidth]', 'tabs width for indentation (default: migrations)')
        .option('--doubleQuote [doubleQuote]', 'use double quotes instead of single quotes for imports')
        .action((name: string, options: IGenerationOption) => void assert.ok(name, 'Name is required') || MigrationFileGenerator.generate(name, options));
}
