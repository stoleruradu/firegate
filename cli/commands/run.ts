import { CommanderStatic } from 'commander';

export function load(commander: CommanderStatic): void {
    commander.program
        .command('migration:run [name]')
        .description('Run all migrations if name was not provided')
        .action(() => void 0);
}
