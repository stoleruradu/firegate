import admin from 'firebase-admin';
import App = admin.app.App;
import Firestore = admin.firestore.Firestore;
import CollectionReference = admin.firestore.CollectionReference;
import * as path from 'path';
import { MIGRATION_COLLECTION_NAME, MIGRATION_DIR } from './constants';
import { IIrreversibleMigration, IMigrationArgs, IReversibleMigration } from './interfaces';

export interface IMigrationRunnerOptions {
    migrationsDir?: string;
    collectionName?: string;
    projectId: string;
}

const isIrreversibleMigration = (migration: unknown): migration is IIrreversibleMigration => {
    return 'function' === typeof Object.getOwnPropertyDescriptor(migration, 'execute')?.value;
};

export class MigrationRunner {
    private static readonly _instance: MigrationRunner;
    private readonly app: App;
    private readonly firestore: Firestore;
    private readonly migrationCollection: CollectionReference;
    private readonly migrationsDir: string;

    private constructor(options: IMigrationRunnerOptions) {
        this.app = admin.initializeApp({
            projectId: options.projectId,
            storageBucket: `${options.projectId}.appspot.com`,
        });
        this.firestore = new Firestore({ projectId: options.projectId });
        this.migrationCollection = this.firestore.collection(options.collectionName || MIGRATION_COLLECTION_NAME);
        this.migrationsDir = path.resolve(process.cwd(), options.migrationsDir || MIGRATION_DIR);
    }

    static instance(options: IMigrationRunnerOptions): MigrationRunner {
        if (MigrationRunner._instance) {
            return MigrationRunner._instance;
        }

        Object.defineProperty(MigrationRunner, '_instance', {
            value: new MigrationRunner(options),
        });

        return MigrationRunner._instance;
    }

    async migrate(migration: IReversibleMigration | IIrreversibleMigration): Promise<void> {
        if (isIrreversibleMigration(migration)) {
            await migration.execute(this.getFirestoreContext());
        } else {
            await migration.up(this.getFirestoreContext());
        }
    }

    async rollback(migration: IReversibleMigration | IIrreversibleMigration): Promise<void> {
        if (isIrreversibleMigration(migration)) {
            throw new Error('Cannot rollback an irreversible migration');
        }
        await migration.down(this.getFirestoreContext());
    }

    async run(name?: string): Promise<void> {}

    getFirestoreContext(): IMigrationArgs {
        return { firestore: this.firestore, app: this.app };
    }
}
