import admin from 'firebase-admin';
import App = admin.app.App;
import Firestore = admin.firestore.Firestore;

export interface IMigrationArgs {
    app: App;
    firestore: Firestore;
}

export interface IReversibleMigration {
    up(args: IMigrationArgs): Promise<void>;
    down(args: IMigrationArgs): Promise<void>;
}

export interface IIrreversibleMigration {
    execute(args: IMigrationArgs): Promise<void>;
}
