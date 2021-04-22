import { CommanderStatic } from 'commander';
import * as GenerateCommand from './commands/generate';
import * as RevertCommand from './commands/revert';
import * as RunCommand from './commands/run';
import * as ListCommand from './commands/list';

export function load(program: CommanderStatic): void {
    GenerateCommand.load(program);
    RevertCommand.load(program);
    RunCommand.load(program);
    ListCommand.load(program);
}
