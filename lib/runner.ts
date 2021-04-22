import admin from 'firebase-admin';
import { IMigration, IMigrationInput, IMigrationLog, IRunnerOptions, MigrationType } from './types';
import * as assert from 'assert';
import { getMigrationAbsolutePath, getMigrationsFiles, isIrreversibleMigration, getMigrationInfo } from './utils';
import { firestore } from 'firebase-admin/lib/firestore';
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

    async migrate(migration: IMigration): Promise<MigrationType> {
        const args = this.createMigrationInput();

        if (isIrreversibleMigration(migration)) {
            await migration.execute(args);
            return MigrationType.irreversible;
        }
        await migration.up(args);

        return MigrationType.reversible;
    }

    async revert(dryRun: boolean, searchString: string): Promise<void> {
        const revert = getMigrationsFiles({ migrationsDir: this.migrationsDir, searchString });

        console.info(`Found ${revert.length} migrations to revert.`);

        for (const migrationFile of revert) {
            const [_, __, id] = getMigrationInfo(migrationFile);
            const migration = await this.createMigration(migrationFile);

        }

        if (isIrreversibleMigration(migration)) {
            throw new Error('Cannot revert an irreversible migration');
        }
        const args = this.createMigrationInput();

        await migration.down(args);
        await this.removeMigrationLog(migrationFile);
    }

    async run(dryRun: boolean, force: boolean, searchString?: string): Promise<void> {
        const migrationFiles = getMigrationsFiles({ migrationsDir: this.migrationsDir, searchString });
        const executedMigrations = await this.getExecutedMigrationLogs();
        const pending = [
            ...(searchString && force
                ? migrationFiles
                : migrationFiles.filter((path) => !executedMigrations.filter(({ timestamp }) => !!~path.indexOf(timestamp)).length)),
        ];

       console.info(`Found ${pending.length} migrations to run.`);

        for (const migrationFile of pending) {
            const [timestamp, name, id] = getMigrationInfo(migrationFile);
            const migration = await this.createMigration(migrationFile);
            if (!dryRun) {
                const type = await this.migrate(migration);
                await this.saveMigrationLog(id, { type, timestamp, name, executedAt: new Date() });
            }
            console.info(`Migration ${migrationFile} executed.`);
        }
    }

    private async createMigration(migrationFileName: string): Promise<IMigration> {
        const migrationPath = getMigrationAbsolutePath({ migrationsDir: this.migrationsDir, migrationFileName });
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

    private async getExecutedMigrationLogs(): Promise<IMigrationLog[]> {
        return this.migrationCollection
            .orderBy('timestamp', 'asc')
            .get()
            .then((snapshot) =>
                snapshot.docs.map(
                    (doc) =>
                        ({
                            ...doc.data(),
                            executedAt: doc.updateTime.toDate(),
                        } as IMigrationLog),
                ),
            );
    }
}
