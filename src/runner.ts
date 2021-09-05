import admin from 'firebase-admin';
import chalk from 'chalk';
import {
    IListOptions,
    IMigration,
    IMigrationInput,
    IMigrationLog,
    IReversibleMigration,
    IRunnerOptions,
    MigrationType,
} from './types';
import {
    getAbsolutePath,
    getMigrationInfo,
    getMigrationsFiles,
    isIrreversible,
} from './utils';
import { firestore } from 'firebase-admin/lib/firestore';
import * as assert from 'assert';
import App = admin.app.App;
import Firestore = admin.firestore.Firestore;
import CollectionReference = admin.firestore.CollectionReference;
import Timestamp = firestore.Timestamp;

interface IServiceAccountCredential {
    projectId: string;
}

const isObject = (value: unknown): value is Record<string, any> =>
    'object' === typeof value && value !== null;
const isString = (value: unknown): value is string => 'string' === typeof value;
const isServiceAccountCredential = (
    credential: unknown,
): credential is IServiceAccountCredential =>
    isObject(credential) && isString(credential.projectId);

const puts = (value: string) => console.log(value);
const printProjectId = (app: App) =>
    puts(
        `Using: ${chalk.bold(
            isServiceAccountCredential(app.options.credential)
                ? app.options.credential.projectId
                : 'Unknown',
        )}\n`,
    );

const teardownError = (error: Error) => {
    console.error(error);
    process.exit(1);
};
const teardown = (fn: (...args: any[]) => any) => async (
    ...args: any[]
): Promise<any> => Promise.resolve(fn(...args)).catch(teardownError);

export class Runner {
    private readonly app: App;
    private readonly firestore: Firestore;
    private readonly migrationCollection: CollectionReference;
    private readonly migrationsDir?: string;

    private constructor(options: IRunnerOptions) {
        this.app = admin.initializeApp();
        this.firestore = this.app.firestore();
        this.migrationCollection = this.firestore.collection(
            options.collectionName || 'migrations',
        );
        this.migrationsDir = options.path;
    }

    static instance(options: IRunnerOptions): Runner {
        return new Runner(options);
    }

    private async migrate(migration: IMigration): Promise<void> {
        const input = this.createMigrationInput();
        const teardownFn = teardown(async () => {
            if (isIrreversible(migration)) {
                await migration.execute(input);
            } else {
                await migration.up(input);
            }
        });

        await teardownFn();
    }

    async revert(
        dryRun: boolean,
        force: boolean,
        searchString?: string,
    ): Promise<void> {
        printProjectId(this.app);

        const foundFiles = getMigrationsFiles({
            migrationsDir: this.migrationsDir,
            searchString,
        });
        const executedMigrations = await this.getExecutedMigrationLogs();
        const revertibleMigrations = [
            ...(searchString && force
                ? foundFiles
                : foundFiles.filter(
                      (migrationFileName) =>
                          !!executedMigrations.filter(
                              ([id]) => !!~migrationFileName.indexOf(id),
                          ).length,
                  )),
        ];
        const teardownFn = teardown(
            async (id: string, migration: IReversibleMigration) => {
                await migration.down(this.createMigrationInput());
                await this.removeMigrationLog(id);
            },
        );

        console.info(
            `Found ${revertibleMigrations.length} migrations to revert.`,
        );

        for (const migrationFile of revertibleMigrations) {
            const [id] = getMigrationInfo(migrationFile);
            const migration = await this.createMigration(migrationFile);

            assert.ok(
                !isIrreversible(migration),
                `Cannot revert ${migrationFile} because it is an irreversible migration.`,
            );

            if (!dryRun) {
                await teardownFn(id, migration);
            }

            console.info(`Migration ${migrationFile} reverted.`);
        }
    }

    async run(
        dryRun: boolean,
        force: boolean,
        searchString?: string,
    ): Promise<void> {
        printProjectId(this.app);

        const foundFiles = getMigrationsFiles({
            migrationsDir: this.migrationsDir,
            searchString,
        });
        const executedMigrations = await this.getExecutedMigrationLogs();
        const runnableMigrations = [
            ...(searchString && force
                ? foundFiles
                : foundFiles.filter(
                      (migrationFileName) =>
                          !executedMigrations.filter(
                              ([id]) => !!~migrationFileName.indexOf(id),
                          ).length,
                  )),
        ];

        console.info(`Found ${runnableMigrations.length} migrations to run.`);

        for (const migrationFile of runnableMigrations) {
            const [id, timestamp, name] = getMigrationInfo(migrationFile);
            const migration = await this.createMigration(migrationFile);

            if (!dryRun) {
                const type = isIrreversible(migration)
                    ? MigrationType.irreversible
                    : MigrationType.reversible;
                await this.migrate(migration);
                await this.saveMigrationLog(id, {
                    type,
                    timestamp,
                    name,
                    executedAt: new Date(),
                });
            }
            console.info(`Migration ${migrationFile} executed.`);
        }
    }

    async list(options: IListOptions): Promise<void> {
        printProjectId(this.app);

        const logMigrations = (list: string[]) =>
            void console.log(list.join('\n'));
        if (options.all) {
            const list = getMigrationsFiles({ migrationsDir: options.path });
            logMigrations(list);
            return;
        }

        if (options.executed) {
            const executed = await this.getExecutedMigrationLogs();
            const foundFiles = getMigrationsFiles({
                migrationsDir: options.path,
            });
            const list = foundFiles.filter(
                (migrationFileName) =>
                    !!executed.filter(
                        ([id]) => !!~migrationFileName.indexOf(id),
                    ).length,
            );
            logMigrations(list);
            return;
        }

        const executed = await this.getExecutedMigrationLogs();
        const foundFiles = getMigrationsFiles({ migrationsDir: options.path });
        const list = foundFiles.filter(
            (migrationFileName) =>
                !executed.filter(([id]) => !!~migrationFileName.indexOf(id))
                    .length,
        );

        logMigrations(list);
    }

    private async createMigration(
        migrationFileName: string,
    ): Promise<IMigration> {
        const migrationPath = getAbsolutePath({
            migrationsDir: this.migrationsDir,
            migrationFileName,
        });
        const { default: MigrationClass } = await import(migrationPath);

        return new MigrationClass();
    }

    private createMigrationInput(): IMigrationInput {
        return { firestore: this.firestore, app: this.app };
    }

    private async saveMigrationLog(
        id: string,
        fields?: Partial<IMigrationLog>,
    ): Promise<void> {
        await this.migrationCollection.doc(id).set(
            {
                ...fields,
                ...(fields?.executedAt && {
                    executedAt: Timestamp.fromDate(fields.executedAt),
                }),
            },
            { merge: true },
        );
    }

    private async removeMigrationLog(id: string): Promise<void> {
        await this.migrationCollection.doc(id).delete();
    }

    async getExecutedMigrationLogs(): Promise<[string, IMigrationLog][]> {
        return this.migrationCollection
            .orderBy('timestamp', 'asc')
            .get()
            .then((snapshot) =>
                snapshot.docs.map((doc) => [
                    doc.id,
                    doc.data() as IMigrationLog,
                ]),
            );
    }
}
