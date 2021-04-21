import { CommanderStatic } from 'commander';
import { MigrationRunner } from '../../lib/migration-runner';
import { IRunnerOptions } from '../../lib/interfaces';
import assert from 'assert';

export function load(commander: CommanderStatic): void {
    commander.program
        .command('migration:revert [name]')
        .description('Revert a migration.')
        .option('--path [path]', 'Path to migrations location.')
        .option('--collectionName [collectionName]', 'Database collection name.')
        .action(async (name, options: IRunnerOptions) => void assert.ok(name, 'Name should be provided') || MigrationRunner.instance(options).revert(name));
}
