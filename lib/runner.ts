import admin from 'firebase-admin';
import {
    IListOptions,
    IMigration,
    IMigrationInput,
    IMigrationLog,
    IRunnerOptions,
    MigrationType,
} from './types';
import { getAbsolutePath, getMigrationInfo, getMigrationsFiles, isIrreversible } from './utils';
import { firestore } from 'firebase-admin/lib/firestore';
import * as assert from 'assert';
import App = admin.app.App;
import Firestore = admin.firestore.Firestore;
import CollectionReference = admin.firestore.CollectionReference;
import Timestamp = firestore.Timestamp;

export class Runner {
    private readonly app: App;
    private readonly firestore: Firestore;
    private readonly migrationCollection: CollectionReference;
    private readonly migrationsDir?: string;

    private constructor(options: IRunnerOptions) {
        this.app = admin.initializeApp();
        this.firestore = this.app.firestore();
        this.migrationCollection = this.firestore.collection(options.collectionName || 'migrations');
        this.migrationsDir = options.path;
    }

    static instance(options: IRunnerOptions): Runner {
        return new Runner(options);
    }

    private async migrate(migration: IMigration): Promise<void> {
        const input = this.createMigrationInput();
        if (isIrreversible(migration)) {
            await migration.execute(input);
        } else {
            await migration.up(input);
        }
    }

    async revert(dryRun: boolean, force: boolean, searchString?: string): Promise<void> {
        const foundFiles = getMigrationsFiles({ migrationsDir: this.migrationsDir, searchString });
        const executedMigrations = await this.getExecutedMigrationLogs();
        const pending = [
            ...(searchString && force
                ? foundFiles
                : foundFiles.filter((migrationFileName) => !!executedMigrations.filter(([id]) => !!~migrationFileName.indexOf(id)).length)),
        ];

        console.info(`Found ${pending.length} migrations to revert.`);

        for (const migrationFile of pending) {
            const [id] = getMigrationInfo(migrationFile);
            const migration = await this.createMigration(migrationFile);

            assert.ok(!isIrreversible(migration), `Cannot revert ${migrationFile} because it is an irreversible migration.`);

            if (!dryRun) {
                await migration.down(this.createMigrationInput());
                await this.removeMigrationLog(id);
            }
            console.info(`Migration ${migrationFile} reverted.`);
        }
    }

    async run(dryRun: boolean, force: boolean, searchString?: string): Promise<void> {
        const foundFiles = getMigrationsFiles({ migrationsDir: this.migrationsDir, searchString });
        const executedMigrations = await this.getExecutedMigrationLogs();
        const pending = [
            ...(searchString && force
                ? foundFiles
                : foundFiles.filter((migrationFileName) => !executedMigrations.filter(([id]) => !!~migrationFileName.indexOf(id)).length)),
        ];

        console.info(`Found ${pending.length} migrations to run.`);

        for (const migrationFile of pending) {
            const [id, timestamp, name] = getMigrationInfo(migrationFile);
            const migration = await this.createMigration(migrationFile);

            if (!dryRun) {
                const type = isIrreversible(migration) ? MigrationType.irreversible : MigrationType.reversible;
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
        const logMigrations = (list: string[]) => void console.log(list.join('\n'));
        if (options.all) {
            const list = getMigrationsFiles({ migrationsDir: options.path });
            logMigrations(list);
            return;
        }

        if (options.executed) {
            const executed = await this.getExecutedMigrationLogs();
            const foundFiles = getMigrationsFiles({ migrationsDir: options.path });
            const list = foundFiles.filter((migrationFileName) => !!executed.filter(([id]) => !!~migrationFileName.indexOf(id)).length);
            logMigrations(list);
            return;
        }

        const executed = await this.getExecutedMigrationLogs();
        const foundFiles = getMigrationsFiles({ migrationsDir: options.path });
        const list = foundFiles.filter((migrationFileName) => !executed.filter(([id]) => !!~migrationFileName.indexOf(id)).length);
        logMigrations(list);
    }

    private async createMigration(migrationFileName: string): Promise<IMigration> {
        const migrationPath = getAbsolutePath({ migrationsDir: this.migrationsDir, migrationFileName });
        const { default: MigrationClass } = await import(migrationPath);

        return new MigrationClass();
    }

    private createMigrationInput(): IMigrationInput {
        return { firestore: this.firestore, app: this.app };
    }

    private async saveMigrationLog(id: string, fields?: Partial<IMigrationLog>): Promise<void> {
        await this.migrationCollection.doc(id).set(
            {
                ...fields,
                ...(fields?.executedAt && { executedAt: Timestamp.fromDate(fields.executedAt) }),
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
            .then((snapshot) => snapshot.docs.map((doc) => [doc.id, doc.data() as IMigrationLog]));
    }
}
