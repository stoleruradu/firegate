import { CommanderStatic } from 'commander';

export function load(commander: CommanderStatic): void {
    commander.program
        .command('migration:revert [name]')
        .description('Revert a migration.')
        .action(() => void 0);
}
