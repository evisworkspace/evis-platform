import type {
  SupabaseLikeClient,
  SupabaseLikeFromBuilder,
  SupabaseLikeResponse,
  SupabaseLikeSelectBuilder,
  SupabaseLikeSingleBuilder
} from './repository';
import type {
  ReadFilterBuilder,
  ReadResponse,
  ReadSelectBuilder,
  SupabaseLikeReadClient
} from './readModels';
import { isTableAllowed, isTableBlocked } from './guards';

export type FakePersistenceOperation =
  | 'from'
  | 'insert'
  | 'select'
  | 'eq'
  | 'order'
  | 'limit'
  | 'single'
  | 'execute_insert'
  | 'execute_select';

export type FakePersistenceCall = {
  order: number;
  table: string;
  operation: FakePersistenceOperation;
  payload?: unknown;
  columns?: string;
};

export type FakePersistenceError = {
  message?: string;
  code?: string;
  details?: string;
};

export type FakePersistenceSimulatedError = {
  table: string;
  operation: 'insert' | 'select';
  error: FakePersistenceError;
  once?: boolean;
};

type Row = Record<string, unknown>;
type RowStore = Record<string, Row[]>;
type Filter = { column: string; value: unknown };
type SortOrder = { column: string; ascending: boolean };

export type FakePersistenceClientOptions = {
  seed?: RowStore;
  simulatedErrors?: FakePersistenceSimulatedError[];
};

export class FakePersistenceClient implements SupabaseLikeClient, SupabaseLikeReadClient {
  private readonly rows: RowStore;
  private readonly calls: FakePersistenceCall[] = [];
  private readonly simulatedErrors: FakePersistenceSimulatedError[];
  private order = 0;
  private generatedId = 0;
  private generatedTimestamp = 0;

  constructor(options: FakePersistenceClientOptions = {}) {
    this.rows = cloneStore(options.seed ?? {});
    this.simulatedErrors = [...(options.simulatedErrors ?? [])];
  }

  from(table: string): FakeTableBuilder {
    this.record({ table, operation: 'from' });
    return new FakeTableBuilder(this, table);
  }

  seed(table: string, rows: Row[]): void {
    this.rows[table] = rows.map((row) => ({ ...row }));
  }

  simulateErrorOnce(error: Omit<FakePersistenceSimulatedError, 'once'>): void {
    this.simulatedErrors.push({ ...error, once: true });
  }

  getCalls(): FakePersistenceCall[] {
    return this.calls.map((call) => ({ ...call }));
  }

  getRows(table: string): Row[] {
    return (this.rows[table] ?? []).map((row) => ({ ...row }));
  }

  getTouchedTables(): string[] {
    return [...new Set(this.calls.map((call) => call.table))];
  }

  record(call: Omit<FakePersistenceCall, 'order'>): void {
    this.order += 1;
    this.calls.push({ order: this.order, ...call });
  }

  async executeInsert(
    table: string,
    row: Row,
    columns?: string
  ): Promise<SupabaseLikeResponse<Row>> {
    this.record({ table, operation: 'execute_insert', payload: row, columns });

    const tableError = this.assertTableCanBeAccessed(table);
    if (tableError) {
      return { data: null, error: tableError };
    }

    const simulatedError = this.consumeSimulatedError(table, 'insert');
    if (simulatedError) {
      return { data: null, error: simulatedError };
    }

    const persisted = { ...row };
    if (!persisted.id) {
      this.generatedId += 1;
      persisted.id = `${table}_${this.generatedId}`;
    }
    if (!persisted.created_at) {
      this.generatedTimestamp += 1;
      persisted.created_at = new Date(Date.UTC(2026, 0, 1, 0, 0, this.generatedTimestamp)).toISOString();
    }

    this.rows[table] = [...(this.rows[table] ?? []), persisted];
    return { data: projectRow(persisted, columns), error: null };
  }

  async executeSelect(
    table: string,
    columns: string | undefined,
    filters: Filter[],
    sortOrder?: SortOrder,
    limitCount?: number
  ): Promise<ReadResponse<Row[]>> {
    this.record({
      table,
      operation: 'execute_select',
      payload: { filters, sortOrder, limit: limitCount },
      columns
    });

    const tableError = this.assertTableCanBeAccessed(table);
    if (tableError) {
      return { data: null, error: tableError };
    }

    const simulatedError = this.consumeSimulatedError(table, 'select');
    if (simulatedError) {
      return { data: null, error: simulatedError };
    }

    let selected = [...(this.rows[table] ?? [])];

    for (const filter of filters) {
      selected = selected.filter((row) => row[filter.column] === filter.value);
    }

    if (sortOrder) {
      selected.sort((left, right) => {
        const leftValue = String(left[sortOrder.column] ?? '');
        const rightValue = String(right[sortOrder.column] ?? '');
        return sortOrder.ascending
          ? leftValue.localeCompare(rightValue)
          : rightValue.localeCompare(leftValue);
      });
    }

    if (typeof limitCount === 'number') {
      selected = selected.slice(0, limitCount);
    }

    return { data: selected.map((row) => projectRow(row, columns)), error: null };
  }

  private assertTableCanBeAccessed(table: string): FakePersistenceError | null {
    if (isTableBlocked(table) || !isTableAllowed(table)) {
      return {
        code: 'P0001',
        message: `Fake persistence blocked access to table ${table}.`,
        details: 'Only Orçamentista pipeline tables are allowed in local validation.'
      };
    }

    return null;
  }

  private consumeSimulatedError(
    table: string,
    operation: 'insert' | 'select'
  ): FakePersistenceError | null {
    const index = this.simulatedErrors.findIndex(
      (error) => error.table === table && error.operation === operation
    );
    if (index < 0) {
      return null;
    }

    const simulated = this.simulatedErrors[index];
    if (simulated.once) {
      this.simulatedErrors.splice(index, 1);
    }

    return simulated.error;
  }
}

export class FakeTableBuilder implements SupabaseLikeFromBuilder, ReadSelectBuilder<Row[]> {
  constructor(
    private readonly client: FakePersistenceClient,
    private readonly table: string
  ) {}

  insert(row: Row): SupabaseLikeSelectBuilder<Row> {
    this.client.record({ table: this.table, operation: 'insert', payload: row });
    return new FakeWriteSelectBuilder(this.client, this.table, row);
  }

  select(columns?: string): ReadFilterBuilder<Row[]> {
    this.client.record({ table: this.table, operation: 'select', columns });
    return new FakeReadFilterBuilder(this.client, this.table, columns);
  }
}

class FakeWriteSelectBuilder implements SupabaseLikeSelectBuilder<Row> {
  constructor(
    private readonly client: FakePersistenceClient,
    private readonly table: string,
    private readonly row: Row
  ) {}

  select(columns?: string): SupabaseLikeSingleBuilder<Row> {
    this.client.record({ table: this.table, operation: 'select', columns });
    return new FakeWriteSingleBuilder(this.client, this.table, this.row, columns);
  }
}

class FakeWriteSingleBuilder implements SupabaseLikeSingleBuilder<Row> {
  constructor(
    private readonly client: FakePersistenceClient,
    private readonly table: string,
    private readonly row: Row,
    private readonly columns?: string
  ) {}

  single(): Promise<SupabaseLikeResponse<Row>> {
    this.client.record({ table: this.table, operation: 'single' });
    return this.client.executeInsert(this.table, this.row, this.columns);
  }
}

class FakeReadFilterBuilder<T extends Row[]> implements ReadFilterBuilder<T> {
  readonly [Symbol.toStringTag] = 'Promise';
  private readonly filters: Filter[] = [];
  private sortOrder: SortOrder | undefined;
  private limitCount: number | undefined;

  constructor(
    private readonly client: FakePersistenceClient,
    private readonly table: string,
    private readonly columns?: string
  ) {}

  eq(column: string, value: unknown): ReadFilterBuilder<T> {
    this.client.record({ table: this.table, operation: 'eq', payload: { column, value } });
    this.filters.push({ column, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): ReadFilterBuilder<T> {
    this.client.record({ table: this.table, operation: 'order', payload: { column, options } });
    this.sortOrder = { column, ascending: options?.ascending ?? true };
    return this;
  }

  limit(count: number): ReadFilterBuilder<T> {
    this.client.record({ table: this.table, operation: 'limit', payload: { count } });
    this.limitCount = count;
    return this;
  }

  async single(): Promise<ReadResponse<T extends (infer U)[] ? U : T>> {
    this.client.record({ table: this.table, operation: 'single' });
    const response = await this.execute();
    const first = response.data?.[0] ?? null;
    return {
      data: first as T extends (infer U)[] ? U : T,
      error: response.error
    };
  }

  then<TResult1 = ReadResponse<T>, TResult2 = never>(
    onfulfilled?: ((value: ReadResponse<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null
  ): Promise<ReadResponse<T> | TResult> {
    return this.execute().catch(onrejected);
  }

  finally(onfinally?: (() => void) | null): Promise<ReadResponse<T>> {
    return this.execute().finally(onfinally ?? undefined);
  }

  private async execute(): Promise<ReadResponse<T>> {
    const response = await this.client.executeSelect(
      this.table,
      this.columns,
      this.filters,
      this.sortOrder,
      this.limitCount
    );

    return response as ReadResponse<T>;
  }
}

function cloneStore(store: RowStore): RowStore {
  return Object.fromEntries(
    Object.entries(store).map(([table, rows]) => [table, rows.map((row) => ({ ...row }))])
  );
}

function projectRow(row: Row, columns?: string): Row {
  if (!columns || columns.trim() === '*') {
    return { ...row };
  }

  const projected: Row = {};
  for (const column of columns.split(',').map((part) => part.trim()).filter(Boolean)) {
    projected[column] = row[column];
  }
  return projected;
}
