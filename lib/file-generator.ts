import fs from 'fs';
import path from 'path';
import { MIGRATION_DIR, PACKAGE_NAME } from './constants';
import * as assert from 'assert';

const EMPTY_LINE = '\n';
const EMPTY_STRING = '';
const SPACE_TAB = ' ';
const DEFAULT_TABS_WIDTH = 2;
const SINGLE_QUOTE = `'`;
const DOUBLE_QUOTE = `"`;

function createStringTabs(tabs: number): string {
    return new Array(tabs).fill(SPACE_TAB).join(EMPTY_STRING);
}

function createMethodTemplate(name: 'execute' | 'up' | 'down', tabWidth: number): string[] {
    const TABS = createStringTabs(tabWidth);
    const TABSx2 = createStringTabs(tabWidth * 2);
    return [`${TABS}async ${name}(args: IMigrationArgs): Promise<void> {`, `${TABSx2}return Promise.resolve(undefined);`, `${TABS}}`];
}

function createIrreversibleTemplate(timestamp: number, tabWidth: number, doubleQuote: boolean): string {
    const QUOTE = doubleQuote ? DOUBLE_QUOTE : SINGLE_QUOTE;
    const HEADER = `import { IIrreversibleMigration, IMigrationArgs } from ${QUOTE}${PACKAGE_NAME}/lib/interfaces${QUOTE};${EMPTY_LINE}`;
    const EXECUTE = createMethodTemplate('execute', tabWidth);
    return [HEADER, `export default class IrreversibleMigration_${timestamp} implements IIrreversibleMigration {`, ...EXECUTE, '}', EMPTY_STRING].join(
        EMPTY_LINE,
    );
}

function createReversibleTemplate(timestamp: number, tabWidth: number, doubleQuote: boolean): string {
    const QUOTE = doubleQuote ? DOUBLE_QUOTE : SINGLE_QUOTE;
    const HEADER = `import { IMigrationArgs, IReversibleMigration } from ${QUOTE}${PACKAGE_NAME}/lib/interfaces${QUOTE};${EMPTY_LINE}`;
    const UP = createMethodTemplate('up', tabWidth);
    const DOWN = createMethodTemplate('down', tabWidth);
    return [
        HEADER,
        `export default class ReversibleMigration_${timestamp} implements IReversibleMigration {`,
        ...UP,
        EMPTY_STRING,
        ...DOWN,
        '}',
        EMPTY_STRING,
    ].join(EMPTY_LINE);
}

export interface IMigrationFileOptions {
    irreversible?: boolean;
    clone?: string;
    path?: string;
    tabs?: string;
    doubleQuote?: boolean;
}

// TODO: add proper abstraction to support JS files
export const TSFileFactory = {
    create(name: string, options: IMigrationFileOptions): void {
        const timestamp = Date.now();
        const migrationsDir = options['path'] || MIGRATION_DIR;
        const irreversible = !!options['irreversible'];
        const migrationName = `${timestamp}-${name}.ts`;
        const migrationsDirPath = path.resolve(process.cwd(), migrationsDir);
        const migrationPath = path.resolve(migrationsDirPath, migrationName);
        const tabs = options.tabs ? Number(options.tabs) : DEFAULT_TABS_WIDTH;

        if (!fs.existsSync(migrationsDirPath)) {
            fs.mkdirSync(migrationsDirPath);
        }

        if (options.clone) {
            const migrations = fs.readdirSync(migrationsDirPath);
            const cloneFileName = migrations.find((path) => !!~path.indexOf(options.clone as string));

            assert.ok(cloneFileName, `Filed to find migration file timestamp: ${options.clone}`);

            const clonePath = path.resolve(migrationsDirPath, cloneFileName);
            const cloneFile = fs.readFileSync(clonePath);

            fs.writeFileSync(migrationPath, Buffer.from(cloneFile));
            return;
        }

        if (irreversible) {
            fs.writeFileSync(migrationPath, Buffer.from(createIrreversibleTemplate(timestamp, tabs, !!options.doubleQuote)));
        } else {
            fs.writeFileSync(migrationPath, Buffer.from(createReversibleTemplate(timestamp, tabs, !!options.doubleQuote)));
        }

        console.log('New migration file created:', migrationPath);
    },
};
