## Description

Firestore migrations CLI to easily generate, run and explore firestore migrations.

## Installation

```
$ npm install -g firegate
```

Make sure to have the firebase `serviceAccountKey.json` file generated and stored somewhere.  
Export the env variable `GOOGLE_APPLICATION_CREDENTIALS='path to serviceAccountKey.json'`.

That's all.

## CLI

```
Usage: firegate <command> [options]

Options:
  -v, --version              output the current version
  -h, --help                 output usage information

Commands:
  generate [options] [name]  create a new migration file
  revert [options] [name]    revert a migration
  run [options] [name]       run either all migration or a single migration when name is provided
  ls [options]               list not executed migrations
  help [command]             display help for command
```

### firegate generate

Migration file name format: [timestamp]-[migration-name].[ext]

```
Usage: firegate generate [options] <name>

Create a new migration file

Options:
  -I, --irreversible  create an irreversible migration
  -C, --clone <name>  create a new migration from existing one
  --path [path]       path to migrations location (default: migrations)
  --tabs [number]     tabs width for indentation
  --doubleQuote       use double quotes instead of single quotes for imports
  --ext [extension]   migration extension type (choices: "js", "ts")
  -h, --help          output usage information
```

### Examples

#### Typescript

Reversible migration template

```typescript
import { IMigrationInput, IReversibleMigration } from 'firegate/lib/types';

export default class ReversibleMigration1619104543555 implements IReversibleMigration {
    async up(input: IMigrationInput): Promise<void> {
        return Promise.resolve(undefined);
    }

    async down(input: IMigrationInput): Promise<void> {
        return Promise.resolve(undefined);
    }
}
```

Irreversible migration template

```typescript
import { IIrreversibleMigration, IMigrationInput } from 'firegate/lib/types';

export default class IrreversibleMigration1619105016442 implements IIrreversibleMigration {
    async execute(input: IMigrationInput): Promise<void> {
        return Promise.resolve(undefined);
    }
}
```

#### Javascript

Reversible migration template

```javascript
module.exports = class ReversibleMigration1619415936888 {
    async up({ app, firestore }) {
        return Promise.resolve(undefined);
    }

    async down({ app, firestore }) {
        return Promise.resolve(undefined);
    }
};
```

Irreversible migration template

```javascript
module.exports = class IrreversibleMigration1619416000408 {
    async execute({ app, firestore }) {
        return Promise.resolve(undefined);
    }
};
```

### firegate run

```
Usage: firegate run [options] [name]

Run either all migration or a single migration by name

Options:
  --path [path]                  path to migrations location (default: migrations)
  --collection [collectionName]  database collection name (default: migrations)
  --force                        force run a migration
  --dry-run [dryRun]             run migrations without applying changes to db
  -h, --help                     output usage information
```

### firegate revert

```
Usage: firegate revert [options] <name>

Revert a migration

Options:
  --path [path]                  path to migrations location (default: migrations)
  --collection [collectionName]  database collection name (default: migrations)
  --force                        force revert of a migration
  --dry-run [dryRun]             run migrations without applying changes to db
  -h, --help                     output usage information
```

### firegate ls

```
Usage: firegate ls [options]

List not executed migrations

Options:
  --path [path]                  path to migrations location (default: migrations)
  --collection [collectionName]  database collection name (default: migrations)
  -E, --executed                 list only executed
  -A, --all                      list all
  -h, --help                     output usage information
```
