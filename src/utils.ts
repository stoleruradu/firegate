import path from 'path';
import fs from 'fs';
import { IIrreversibleMigration } from './types';
import assert from 'assert';

export const getAbsolutePath = (input: {
    migrationsDir?: string;
    migrationFileName?: string;
}): string => {
    const absolutePath = input.migrationsDir || 'migrations';

    if (!fs.existsSync(absolutePath)) {
        fs.mkdirSync(absolutePath);
    }

    if (input.migrationFileName) {
        return path.resolve(
            process.cwd(),
            absolutePath,
            input.migrationFileName,
        );
    }

    return path.resolve(process.cwd(), absolutePath);
};

export const getExtName = (fileName: string): string => {
    return path.extname(fileName).split('.').pop() as string;
};

export const getMigrationsFiles = (input: {
    searchString?: string;
    migrationsDir?: string;
}): string[] => {
    const absolutePath = getAbsolutePath({
        migrationsDir: input.migrationsDir,
    });
    const files = fs
        .readdirSync(absolutePath)
        .filter((fileName) => /[0-9]+-.+\.(ts|js)/.test(fileName));

    if (input.searchString) {
        return files.filter(
            (fileName) => !!~fileName.indexOf(input.searchString as string),
        );
    }

    return files;
};

export const isIrreversible = (
    migration: unknown,
): migration is IIrreversibleMigration => {
    const isObject = (value: unknown): value is Record<string, unknown> =>
        '[object Object]' === Object.prototype.toString.call(migration);
    const isFunction = (
        value: unknown,
    ): value is (...args: unknown[]) => unknown =>
        ['[object Function]', '[object AsyncFunction]'].includes(
            Object.prototype.toString.call(value),
        );
    return isObject(migration) && isFunction(migration['execute']);
};

export const getMigrationInfo = (
    fileName: string,
    ext = '.ts',
): [string, string, string] => {
    const match = /([0-9]+)-(.+)/s.exec(fileName);
    assert.ok(match);
    return [
        path.basename(fileName, ext),
        match[1],
        path.basename(match[2], '.ts'),
    ];
};
