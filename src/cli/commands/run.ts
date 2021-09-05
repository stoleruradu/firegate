import { CommanderStatic } from 'commander';
import { Runner } from '../../runner';
import { IRunnerOptions } from '../../types';

export function load(commander: CommanderStatic): void {
    commander.program
        .command('run [name]')
        .description('Run either all migration or a single migration by name')
        .option(
            '--path [path]',
            'path to migrations location (default: migrations)',
        )
        .option(
            '--collection [collectionName]',
            'database collection name (default: migrations)',
        )
        .option('--force', 'force run a migration')
        .option(
            '--dry-run [dryRun]',
            'run migrations without applying changes to db',
        )
        .action(async (name: string | undefined, options: IRunnerOptions) =>
            Runner.instance(options).run(
                !!options.dryRun,
                !!options.force,
                name,
            ),
        );
}
