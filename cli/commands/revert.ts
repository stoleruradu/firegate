import { CommanderStatic } from 'commander';
import { Runner } from '../../lib/runner';
import { IRunnerOptions } from '../../lib/types';
import assert from 'assert';

export function load(commander: CommanderStatic): void {
    commander.program
        .command('revert [name]')
        .description('revert a migration')
        .option('--path [path]', 'path to migrations location')
        .option('--collection [collectionName]', 'database collection name')
        .option('--force', 'force revert of a migration')
        .option('--dry-run [dryRun]', 'run migrations without applying changes to db')
        .action(async (name, options: IRunnerOptions) => void assert.ok(name, 'Name should be provided') || Runner.instance(options).revert(!!options.dryRun, !!options.force, name));
}
