import { CommanderStatic } from 'commander';
import { Runner } from '../../runner';
import { IRunnerOptions } from '../../types';

export function load(commander: CommanderStatic): void {
    commander.program
        .command('revert <name>')
        .description('Revert a migration')
        .option('--path [path]', 'path to migrations location (default: migrations)')
        .option('--collection [collectionName]', 'database collection name (default: migrations)')
        .option('--force', 'force revert of a migration')
        .option('--dry-run [dryRun]', 'run migrations without applying changes to db')
        .action(async (name, options: IRunnerOptions) => Runner.instance(options).revert(!!options.dryRun, !!options.force, name));
}
