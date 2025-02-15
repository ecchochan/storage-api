import { Client } from 'pg'
import { migrate } from 'postgres-migrations'
import { getConfig } from '../config'

const { multitenantDatabaseUrl } = getConfig()

/**
 * Runs tenant migrations
 */
export async function runMigrations(): Promise<void> {
  console.log('running migrations')
  await connectAndMigrate(process.env.DATABASE_URL, './migrations/tenant')
  console.log('finished migrations')
}

/**
 * Runs multi-tenant migrations
 */
export async function runMultitenantMigrations(): Promise<void> {
  console.log('running multitenant migrations')
  await connectAndMigrate(multitenantDatabaseUrl, './migrations/multitenant')
  console.log('finished multitenant migrations')
}

/**
 * Runs migrations on a specific tenant by providing its database DSN
 * @param databaseUrl
 */
export async function runMigrationsOnTenant(databaseUrl: string): Promise<void> {
  await connectAndMigrate(databaseUrl, './migrations/tenant')
}

async function connectAndMigrate(databaseUrl: string | undefined, migrationsDirectory: string) {
  const dbConfig = {
    connectionString: databaseUrl,
    connectionTimeoutMillis: 10_000,
    options: '-c search_path=storage,public',
  }
  const client = new Client(dbConfig)
  try {
    await client.connect()
    await migrate({ client }, migrationsDirectory)
  } finally {
    await client.end()
  }
}
