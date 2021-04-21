import { CommanderStatic } from 'commander';
import * as MakeCommand from './commands/create';
import * as RevertCommand from  './commands/revert';
import * as RunCommand from  './commands/revert';

export function load(program: CommanderStatic): void {
    MakeCommand.load(program);
    RevertCommand.load(program);
    RunCommand.load(program);
}
