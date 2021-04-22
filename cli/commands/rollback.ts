import { CommanderStatic } from 'commander';
import { Runner } from '../../lib/runner';
import { IRunnerOptions } from '../../lib/types';
import assert from 'assert';

export function load(commander: CommanderStatic): void {
    commander.program
        .command('migration:rollback [name]')
        .description('Revert a migration.')
        .option('--path [path]', 'Path to migrations location.')
        .option('--collectionName [collectionName]', 'Database collection name.')
        .option('--force [force]', 'Indicates to reran an executed migration.')
        .option('--dry-run [dryRun]', 'Run migrations without applying changes to db.')
        .action(async (name, options: IRunnerOptions) => void assert.ok(name, 'Name should be provided') || Runner.instance(options).rollback(!!options.dryRun, !!options.force, name));
}
