import { CommanderStatic } from 'commander';
import { IRunnerOptions } from '../../lib/types';
import { Runner } from '../../lib/runner';

export function load(commander: CommanderStatic): void {
    commander.program
        .command('run [name]')
        .description('run either all migration or a single migration when name is provided')
        .option('--path [path]', 'path to migrations location')
        .option('--collection [collectionName]', 'database collection name')
        .option('--force', 'force run a migration')
        .option('--dry-run [dryRun]', 'run migrations without applying changes to db')
        .action(async (name: string | undefined, options: IRunnerOptions) => Runner.instance(options).run(!!options.dryRun, !!options.force, name));
}
