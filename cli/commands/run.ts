import { CommanderStatic } from 'commander';
import { IRunnerOptions } from '../../lib/interfaces';
import { MigrationRunner } from '../../lib/migration-runner';

export function load(commander: CommanderStatic): void {
    commander.program
        .command('migration:run [name]')
        .description('Run either all migration or a single migration when name is provided')
        .option('--path [path]', 'Path to migrations location.')
        .option('--collectionName [collectionName]', 'Database collection name.')
        .option('--force [force]', 'Indicates to reran an executed migration.')
        .option('--dry-run [dryRun]', 'Simulates migrations executions.')
        .action(async (name: string | undefined, options: IRunnerOptions) => {
            if(name) {
                await MigrationRunner.instance(options).runOne(name, !!options.force)
            } else {
                await MigrationRunner.instance(options).run(!!options.dryRun);
            }
        });
}
