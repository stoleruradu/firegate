import admin from 'firebase-admin';
import App = admin.app.App;
import Firestore = admin.firestore.Firestore;

export interface IMigrationInput {
    app: App;
    firestore: Firestore;
}

export interface IReversibleMigration {
    up(input: IMigrationInput): Promise<void>;
    down(input: IMigrationInput): Promise<void>;
}

export interface IIrreversibleMigration {
    execute(input: IMigrationInput): Promise<void>;
}

export type IMigration = IReversibleMigration | IIrreversibleMigration;

export interface IRunnerOptions {
    path?: string;
    collectionName?: string;
    force?: boolean;
    dryRun?: boolean;
}

export enum MigrationType {
    reversible = 'reversible',
    irreversible = 'irreversible',
}

export interface IExecutedMigration {
    timestamp: string;
    name: string;
    type: MigrationType;
}
