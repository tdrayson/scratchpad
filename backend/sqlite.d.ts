declare module 'tjs:sqlite' {
  export class Statement {
    run(...params: unknown[]): void
    all(...params: unknown[]): Record<string, any>[]
    finalize(): void
  }
  export class Database {
    constructor(path: string)
    exec(sql: string): void
    prepare(sql: string): Statement
    close(): void
  }
}
