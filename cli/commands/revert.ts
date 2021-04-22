import { CommanderStatic } from 'commander';
import { Runner } from '../../lib/runner';
import { IRunnerOptions } from '../../lib/types';
import assert from 'assert';

export function load(commander: CommanderStatic): void {
    commander.program
        .command('migration:revert [name]')
        .description('Revert a migration.')
        .option('--path [path]', 'Path to migrations location.')
        .option('--collectionName [collectionName]', 'Database collection name.')
        .action(async (name, options: IRunnerOptions) => void assert.ok(name, 'Name should be provided') || Runner.instance(options).revert(name));
}
