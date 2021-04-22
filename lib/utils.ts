import path from 'path';
import fs from 'fs';
import { IIrreversibleMigration } from './types';
import assert from 'assert';

export const getMigrationAbsolutePath = (input: { migrationsDir?: string; migrationFileName?: string }): string => {
    const migrationsPath = input.migrationsDir || 'migrations';
    if (input.migrationFileName) {
        return path.resolve(process.cwd(), migrationsPath, input.migrationFileName);
    }
    return path.resolve(process.cwd(), migrationsPath);
};

export const getMigrationsFiles = (input: { searchString?: string; migrationsDir?: string }): string[] => {
    const absolutePath = getMigrationAbsolutePath({ migrationsDir: input.migrationsDir });

    if (!fs.existsSync(absolutePath)) {
        fs.mkdirSync(absolutePath);
    }

    const files = fs.readdirSync(absolutePath).filter((fileName) => /[0-9]+-.+\.(ts|js)/.test(fileName));

    if (input.searchString) {
        return files.filter((fileName) => !!~fileName.indexOf(input.searchString as string));
    }

    return files;
};

export const isIrreversible = (migration: unknown): migration is IIrreversibleMigration => {
    const isObject = (value: unknown): value is Record<string, unknown> => '[object Object]' === Object.prototype.toString.call(migration);
    const isFunction = (value: unknown): value is (...args: unknown[]) => unknown =>
        ['[object Function]', '[object AsyncFunction]'].includes(Object.prototype.toString.call(value));
    return isObject(migration) && isFunction(migration['execute']);
};

export const getMigrationInfo = (fileName: string, ext = '.ts'): [string, string, string] => {
    const match = /([0-9]+)-(.+)/s.exec(fileName);
    assert.ok(match);
    return [path.basename(fileName, ext), match[1], path.basename(match[2], '.ts')];
};
