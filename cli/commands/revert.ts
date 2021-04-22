import { CommanderStatic } from 'commander';
import { Runner } from '../../lib/runner';
import { IRunnerOptions } from '../../lib/types';
import assert from 'assert';

export function load(commander: CommanderStatic): void {
    commander.program
        .command('revert [name]')
        .description('Revert a migration.')
        .option('--path [path]', 'Path to migrations location.')
        .option('--collection [collectionName]', 'Database collection name.')
        .option('--force', 'Indicates to reran an executed migration.')
        .option('--dry-run [dryRun]', 'Run migrations without applying changes to db.')
        .action(async (name, options: IRunnerOptions) => void assert.ok(name, 'Name should be provided') || Runner.instance(options).revert(!!options.dryRun, !!options.force, name));
}
