import { CommanderStatic } from 'commander';
import * as GenerateCommand from './commands/generate';
import * as RollbackCommand from './commands/rollback';
import * as RunCommand from './commands/run';

export function load(program: CommanderStatic): void {
    GenerateCommand.load(program);
    RollbackCommand.load(program);
    RunCommand.load(program);
}
