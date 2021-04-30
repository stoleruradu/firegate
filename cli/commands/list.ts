import { CommanderStatic } from 'commander';
import { IListOptions } from '../../lib/types';
import { Runner } from '../../lib/runner';

export function load(commander: CommanderStatic): void {
    commander.program
        .command('ls')
        .description('List not executed migrations')
        .option('--path [path]', 'path to migrations location (default: migrations)')
        .option('--collection [collectionName]', 'database collection name (default: migrations)')
        .option('-E, --executed', 'list only executed')
        .option('-A, --all', 'list all')
        .action(async (options: IListOptions) => Runner.instance({ collectionName: options.collectionName, path: options.path }).list(options));
}
