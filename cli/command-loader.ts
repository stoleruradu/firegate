import { CommanderStatic } from 'commander';
import * as MakeCommand from './commands/create';

export function load(program: CommanderStatic): void {
    MakeCommand.load(program);
}
