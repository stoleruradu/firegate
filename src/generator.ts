import fs from 'fs';
import * as assert from 'assert';
import { GenerateOptions, ITemplateFactory } from './types';
import { getAbsolutePath, getExtName, getMigrationsFiles } from './utils';

const NEW_LINE = '\n';
const EMPTY_STRING = '';
const SPACE_TAB = ' ';
const SINGLE_QUOTE = `'`;
const DOUBLE_QUOTE = `"`;

class TemplateBuilder {
    protected readonly template: string[];
    protected readonly doubleQuote: boolean;
    protected readonly tabsWidth: number;
    protected readonly quote: string;

    constructor(doubleQuote: boolean, tabsWidth?: number) {
        this.template = [];
        this.doubleQuote = doubleQuote;
        this.tabsWidth = tabsWidth ?? 4;
        this.quote = doubleQuote ? DOUBLE_QUOTE : SINGLE_QUOTE;
    }

    clone() {
        return new TemplateBuilder(this.doubleQuote, this.tabsWidth);
    }

    writeLn(content: string = EMPTY_STRING): TemplateBuilder {
        this.template.push(...[content, NEW_LINE]);
        return this;
    }

    write(content: string): TemplateBuilder {
        this.template.push(content);
        return this;
    }

    spaceTabs(tabs: number): TemplateBuilder {
        this.template.push(new Array(tabs * this.tabsWidth).fill(SPACE_TAB).join(EMPTY_STRING));
        return this;
    }

    quoted(content: string): TemplateBuilder {
        return this.load(this.clone().write(this.quote).write(content).write(this.quote));
    }

    load(builder: TemplateBuilder): TemplateBuilder {
        this.template.push(builder.build());
        return this;
    }

    reset(): TemplateBuilder {
        this.template.length = 0;
        return this;
    }

    build(): string {
        return this.template.join(EMPTY_STRING);
    }
}

abstract class TemplateFactory implements ITemplateFactory {
    protected readonly builder: TemplateBuilder;
    protected constructor(protected readonly pkgName: string, doubleQuote: boolean, tabsWidth?: number) {
        this.builder = new TemplateBuilder(doubleQuote, tabsWidth);
    }

    abstract createIrreversibleMigration(timestamp: number): string;
    abstract createReversibleMigration(timestamp: number): string;
}

class TypescriptTemplateFactory extends TemplateFactory {
    constructor(pkgName: string, doubleQuote: boolean, tabsWidth?: number) {
        super(pkgName, doubleQuote, tabsWidth)
    }

    private createMethodBuilder(name: 'execute' | 'up' | 'down'): TemplateBuilder {
        return this.builder
            .clone()
            .spaceTabs(1)
            .writeLn(`async ${name}(input: IMigrationInput): Promise<void> {`)
            .spaceTabs(2)
            .writeLn(`return Promise.resolve(undefined);`)
            .spaceTabs(1)
            .writeLn('}');
    }

    protected createImportsBuilder(imports: string[]): TemplateBuilder {
        return this.builder
            .clone()
            .write(`import { ${imports.join(', ')} } from `)
            .quoted(`${this.pkgName}/lib/types`)
            .writeLn(';');
    }

    createReversibleMigration(timestamp: number): string {
        const [up, down] = ['up', 'down'].map((method) => this.createMethodBuilder(method as 'up' | 'down'));
        return this.builder
            .reset()
            .load(this.createImportsBuilder(['IMigrationInput', 'IReversibleMigration']))
            .writeLn()
            .writeLn(`export default class ReversibleMigration${timestamp} implements IReversibleMigration {`)
            .load(up)
            .writeLn()
            .load(down)
            .writeLn('}')
            .build();
    }

    createIrreversibleMigration(timestamp: number): string {
        return this.builder
            .reset()
            .load(this.createImportsBuilder(['IIrreversibleMigration', 'IMigrationInput']))
            .writeLn()
            .writeLn(`export default class IrreversibleMigration${timestamp} implements IIrreversibleMigration {`)
            .load(this.createMethodBuilder('execute'))
            .writeLn('}')
            .build();
    }
}

class JavascriptTemplateFactory extends TemplateFactory {
    constructor(pkgName: string, doubleQuote: boolean, tabsWidth?: number) {
        super(pkgName, doubleQuote, tabsWidth)
    }

    createIrreversibleMigration(timestamp: number): string {
        return this.builder.
            reset()
            .writeLn(`module.exports = class IrreversibleMigration${timestamp} {`)
            .spaceTabs(1)
            .writeLn(`async execute({ app, firestore }) {`)
            .spaceTabs(2)
            .writeLn(`return Promise.resolve(undefined);`)
            .spaceTabs(1)
            .writeLn('}')
            .writeLn('}')
            .build()
    }

    createReversibleMigration(timestamp: number): string {
        return this.builder.
            reset()
            .writeLn(`module.exports = class ReversibleMigration${timestamp} {`)
            .spaceTabs(1)
            .writeLn(`async up({ app, firestore }) {`)
            .spaceTabs(2)
            .writeLn(`return Promise.resolve(undefined);`)
            .spaceTabs(1)
            .writeLn('}')
            .writeLn()
            .spaceTabs(1)
            .writeLn(`async down({ app, firestore }) {`)
            .spaceTabs(2)
            .writeLn(`return Promise.resolve(undefined);`)
            .spaceTabs(1)
            .writeLn('}')
            .writeLn('}')
            .build()
    }

}

export class MigrationGenerator {
    private readonly factories = new Map<'js' | 'ts', ITemplateFactory>();
    private readonly getMigrationName = (timestamp: number, name: string, ext: 'js' | 'ts') => `${timestamp}-${name}.${ext}`;

    private constructor(private readonly options: GenerateOptions, packageName: string) {
        this.factories.set('js', new JavascriptTemplateFactory(packageName, !!options.doubleQuote, options.tabs));
        this.factories.set('ts', new TypescriptTemplateFactory(packageName, !!options.doubleQuote, options.tabs));
    }

    static create(options: GenerateOptions, packageName: string): MigrationGenerator {
        return new MigrationGenerator(options, packageName);
    }

    private get templateFactory(): ITemplateFactory {
        switch (this.options.ext) {
            case 'js':
                return this.factories.get('js')!;
            case 'ts':
                return this.factories.get('ts')!;
            default:
                return this.factories.get('ts')!;
        }
    }

    generate(name: string): void {
        const timestamp = Date.now();
        const irreversible = !!this.options['irreversible'];

        if (this.options.clone) {
            const [cloneFileName] = getMigrationsFiles({ migrationsDir: this.options.path, searchString: this.options.clone });

            assert.ok(cloneFileName, `Filed to find migration file timestamp: ${this.options.clone}`);

            const ext = getExtName(cloneFileName);
            const migrationName = this.getMigrationName(timestamp, name, ext as 'ts' | 'js');
            const clonePath = getAbsolutePath({ migrationsDir: this.options.path, migrationFileName: cloneFileName });
            const migrationPath = getAbsolutePath({ migrationsDir: this.options.path, migrationFileName: migrationName });
            const cloneFile = fs
                .readFileSync(clonePath)
                .toString()
                .replace(/(.+?)(Reversible|Irreversible)(Migration)([0-9]+)/gm, `$1$2$3${timestamp}`);

            fs.writeFileSync(migrationPath, Buffer.from(cloneFile));

            console.log(`New migration clone created: ${migrationPath}`);
            return;
        }

        const migrationName = this.getMigrationName(timestamp, name, this.options.ext ?? 'ts');
        const migrationPath = getAbsolutePath({ migrationsDir: this.options.path, migrationFileName: migrationName });
        const template: string = irreversible
            ? this.templateFactory.createIrreversibleMigration(timestamp)
            : this.templateFactory.createReversibleMigration(timestamp);

        fs.writeFileSync(migrationPath, Buffer.from(template));

        console.log(`New migration file created: ${migrationPath}`);
    }
}
