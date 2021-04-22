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

export interface IListOptions {
    path?: string;
    collectionName?: string;
    executed?: boolean;
    all?: boolean;
}

export interface IGenerationOption {
    irreversible?: boolean;
    clone?: string;
    path?: string;
    tabs?: string;
    doubleQuote?: boolean;
}

export enum MigrationType {
    reversible = 'reversible',
    irreversible = 'irreversible',
}

export interface IMigrationLog {
    timestamp: string;
    name: string;
    type: MigrationType;
    executedAt: Date;
}
