import fs from 'fs';
import * as assert from 'assert';
import { IGenerationOption } from './types';
import { getAbsolutePath, getMigrationsFiles } from './utils';

const EMPTY_LINE = '\n';
const EMPTY_STRING = '';
const SPACE_TAB = ' ';
const DEFAULT_TABS_WIDTH = 2;
const SINGLE_QUOTE = `'`;
const DOUBLE_QUOTE = `"`;
const PACKAGE_NAME = require('../package.json').name as string;

function createStringTabs(tabs: number): string {
    return new Array(tabs).fill(SPACE_TAB).join(EMPTY_STRING);
}

function createMethodTemplate(name: 'execute' | 'up' | 'down', tabWidth: number): string[] {
    const TABS = createStringTabs(tabWidth);
    const TABSx2 = createStringTabs(tabWidth * 2);
    return [`${TABS}async ${name}(input: IMigrationInput): Promise<void> {`, `${TABSx2}return Promise.resolve(undefined);`, `${TABS}}`];
}

function createIrreversibleTemplate(timestamp: number, tabWidth: number, doubleQuote: boolean): string {
    const QUOTE = doubleQuote ? DOUBLE_QUOTE : SINGLE_QUOTE;
    const HEADER = `import { IIrreversibleMigration, IMigrationInput } from ${QUOTE}${PACKAGE_NAME}/lib/types${QUOTE};${EMPTY_LINE}`;
    const EXECUTE = createMethodTemplate('execute', tabWidth);
    return [HEADER, `export default class IrreversibleMigration${timestamp} implements IIrreversibleMigration {`, ...EXECUTE, '}', EMPTY_STRING].join(
        EMPTY_LINE,
    );
}

function createReversibleTemplate(timestamp: number, tabWidth: number, doubleQuote: boolean): string {
    const QUOTE = doubleQuote ? DOUBLE_QUOTE : SINGLE_QUOTE;
    const HEADER = `import { IMigrationInput, IReversibleMigration } from ${QUOTE}${PACKAGE_NAME}/lib/types${QUOTE};${EMPTY_LINE}`;
    const UP = createMethodTemplate('up', tabWidth);
    const DOWN = createMethodTemplate('down', tabWidth);
    return [
        HEADER,
        `export default class ReversibleMigration${timestamp} implements IReversibleMigration {`,
        ...UP,
        EMPTY_STRING,
        ...DOWN,
        '}',
        EMPTY_STRING,
    ].join(EMPTY_LINE);
}

// TODO: add proper abstraction to support JS files
export const MigrationFileGenerator = {
    generate(name: string, options: IGenerationOption): void {
        const timestamp = Date.now();
        const irreversible = !!options['irreversible'];
        const migrationName = `${timestamp}-${name}.ts`;
        const migrationPath = getAbsolutePath({ migrationsDir: options.path, migrationFileName: migrationName });
        const tabs = options.tabs ? Number(options.tabs) : DEFAULT_TABS_WIDTH;

        if (options.clone) {
            const [cloneFileName] = getMigrationsFiles({ migrationsDir: options.path, searchString: options.clone })

            assert.ok(cloneFileName, `Filed to find migration file timestamp: ${options.clone}`);

            const clonePath = getAbsolutePath({ migrationsDir: options.path, migrationFileName: cloneFileName});
            const cloneFile = fs
                .readFileSync(clonePath)
                .toString()
                .replace(/(class\s+?)(Reversible|Irreversible)(Migration)([0-9]+)/s, `$1$2$3${timestamp}`);

            fs.writeFileSync(migrationPath, Buffer.from(cloneFile));

            console.log(`New migration clone created: ${migrationPath}`);
            return;
        }

        if (irreversible) {
            fs.writeFileSync(migrationPath, Buffer.from(createIrreversibleTemplate(timestamp, tabs, !!options.doubleQuote)));
        } else {
            fs.writeFileSync(migrationPath, Buffer.from(createReversibleTemplate(timestamp, tabs, !!options.doubleQuote)));
        }

        console.log(`New migration file created: ${migrationPath}`);
    },
};
