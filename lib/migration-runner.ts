import admin from 'firebase-admin';
import * as path from 'path';
import { MIGRATION_COLLECTION_NAME, MIGRATION_DIR } from './constants';
import { IIrreversibleMigration, IMigration, IMigrationInput, IExecutedMigration, IRunnerOptions, MigrationType } from './interfaces';
import * as assert from 'assert';
import * as fs from 'fs';
import App = admin.app.App;
import Firestore = admin.firestore.Firestore;
import CollectionReference = admin.firestore.CollectionReference;

const isIrreversibleMigration = (migration: unknown): migration is IIrreversibleMigration => {
    return 'function' === typeof Object.getOwnPropertyDescriptor(migration, 'execute')?.value;
};

const parseMigrationInfo = (fileName: string): [string, string] => {
    const match = /([0-9]+)-(.+)/s.exec(fileName);
    assert.ok(match);
    return [match[1], path.basename(match[2], '.ts')];
};

const parseMigrationUID = (fileName: string, ext = '.ts'): string => {
    return path.basename(fileName, ext);
};

export class MigrationRunner {
    private readonly app: App;
    private readonly firestore: Firestore;
    private readonly migrationCollection: CollectionReference;
    private readonly migrationsDir: string;

    private constructor(options: IRunnerOptions) {
        this.app = admin.initializeApp();
        this.firestore = this.app.firestore();
        this.migrationCollection = this.firestore.collection(options.collectionName || MIGRATION_COLLECTION_NAME);
        this.migrationsDir = path.resolve(process.cwd(), options.path || MIGRATION_DIR);
    }

    static instance(options: IRunnerOptions): MigrationRunner {
        return new MigrationRunner(options);
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

    async revert(searchString: string): Promise<void> {
        const [migrationFile] = this.getMigrationFiles(searchString);

        assert.ok(migrationFile, 'Migration file does not exists');

        const migration = await this.createMigration(migrationFile);

        if (isIrreversibleMigration(migration)) {
            throw new Error('Cannot revert an irreversible migration');
        }
        const args = this.createMigrationInput();

        await migration.down(args);
        await this.removeExecutedMigrationLog(migrationFile);
    }

    async runOne(searchString: string, force: boolean): Promise<void> {
        const [migrationFile] = this.getMigrationFiles(searchString);

        assert.ok(migrationFile, 'Migration file does not exists');

        const [timestamp] = parseMigrationInfo(migrationFile);
        const isExecuted = await this.isExecuted(timestamp);

        if (!isExecuted || (isExecuted && force)) {
            const migration = await this.createMigration(migrationFile);
            const type = await this.migrate(migration);
            await this.saveExecutedMigrationLog(migrationFile, type);
            console.info(`Migration ${migrationFile} executed.`);
            return;
        }
        console.info('Migration already executed. Use --fore to run it one more time.');
    }

    async run(dryRun: boolean): Promise<void> {
        const migrationFiles = this.getMigrationFiles();
        const executedMigrations = await this.getExecutedMigrationLogs();
        const pending = migrationFiles.filter((path) => !executedMigrations.filter(({ timestamp }) => !!~path.indexOf(timestamp)).length);

        console.info(`Found ${pending.length} migrations to run.`);

        for (const migrationFile of pending) {
            const migration = await this.createMigration(migrationFile);
            if (!dryRun) {
                const type = await this.migrate(migration);
                await this.saveExecutedMigrationLog(migrationFile, type);
            }
            console.info(`Migration ${migrationFile} executed.`);
        }
    }

    private async createMigration(fileName: string): Promise<IMigration> {
        const migrationPath = path.resolve(this.migrationsDir, fileName);
        const { default: MigrationClass } = await import(migrationPath);
        return new MigrationClass();
    }

    private getMigrationFiles(searchString?: string): string[] {
        const paths = fs.readdirSync(this.migrationsDir);
        if (searchString) {
            return paths.filter((path) => !!~path.indexOf(searchString));
        }
        return paths;
    }

    private createMigrationInput(): IMigrationInput {
        return { firestore: this.firestore, app: this.app };
    }

    private async saveExecutedMigrationLog(fileName: string, type: MigrationType): Promise<void> {
        const [timestamp, name] = parseMigrationInfo(fileName);
        const id = parseMigrationUID(fileName);
        await this.migrationCollection.doc(id).create({ timestamp, name, type });
    }

    private async removeExecutedMigrationLog(migrationFile: string): Promise<void> {
        const id = parseMigrationUID(migrationFile);
        await this.migrationCollection.doc(id).delete();
    }

    private async isExecuted(timestamp: string): Promise<boolean> {
        const snapshot = await this.migrationCollection.where('timestamp', '==', timestamp).get();
        const [document] = snapshot.docs;
        return document && document.exists;
    }

    private async getExecutedMigrationLogs(): Promise<IExecutedMigration[]> {
        return this.migrationCollection
            .orderBy('timestamp', 'asc')
            .get()
            .then((snapshot) => snapshot.docs.map((doc) => doc.data() as IExecutedMigration));
    }
}
