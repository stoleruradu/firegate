import { CommanderStatic } from 'commander';
import { IRunnerOptions } from '../../lib/types';
import { Runner } from '../../lib/runner';

export function load(commander: CommanderStatic): void {
    commander.program
        .command('migration:run [name]')
        .description('Run either all migration or a single migration when name is provided')
        .option('--path [path]', 'Path to migrations location.')
        .option('--collectionName [collectionName]', 'Database collection name.')
        .option('--force [force]', 'Indicates to reran an executed migration.')
        .option('--dry-run [dryRun]', 'Run migrations without applying changes to db.')
        .action(async (name: string | undefined, options: IRunnerOptions) => Runner.instance(options).run(!!options.dryRun, !!options.force, name));
}
