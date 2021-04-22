import { CommanderStatic } from 'commander';
import { IListOptions } from '../../lib/types';
import { Runner } from '../../lib/runner';
import { getMigrationsFiles } from '../../lib/utils';

export function load(commander: CommanderStatic): void {
    commander.program
        .command('ls')
        .description('list not executed migrations')
        .option('--path [path]', 'path to migrations location')
        .option('--collection [collectionName]', 'database collection name')
        .option('-E, --executed', 'list only executed')
        .option('-A, --all', 'list all')
        .action(async (options: IListOptions) => {
            const logMigrations = (list: string[]) => void console.log(list.join('\n'));
            if (options.all) {
                const list = getMigrationsFiles({ migrationsDir: options.path });
                logMigrations(list);
                return;
            }

            if (options.executed) {
                const executed = await Runner.instance(options).getExecutedMigrationLogs();
                const foundFiles = getMigrationsFiles({ migrationsDir: options.path });
                const list = foundFiles.filter((migrationFileName) => !!executed.filter(([id]) => !!~migrationFileName.indexOf(id)).length);
                logMigrations(list);
                return;
            }

            const executed = await Runner.instance(options).getExecutedMigrationLogs();
            const foundFiles = getMigrationsFiles({ migrationsDir: options.path });
            const list = foundFiles.filter((migrationFileName) => !executed.filter(([id]) => !!~migrationFileName.indexOf(id)).length);
            logMigrations(list);
        });
}
