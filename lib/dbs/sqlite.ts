import BetterSqlite3 from 'better-sqlite3'
import path from 'path'
import { SessionProps } from '../../types'

const db = new BetterSqlite3(path.join(process.cwd(), 'blobfish.db'))

db.exec(`
  CREATE TABLE IF NOT EXISTS stores (
      store_hash  TEXT PRIMARY KEY,
      access_token TEXT,
      scope       TEXT,
      admin_id    INTEGER
  );
  CREATE TABLE IF NOT EXISTS store_users (
      user_id     TEXT NOT NULL,
      store_hash  TEXT NOT NULL,
      is_admin    INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, store_hash)
  );
  CREATE TABLE IF NOT EXISTS users (
      user_id     TEXT PRIMARY KEY,
      email       TEXT,
      username    TEXT
  );
`)

function getStoreHash(session: SessionProps) {
  const contextString = session.context ?? session.sub

  return contextString?.split('/')[1] || ''
}

export async function setUser({ user }: SessionProps) {
  if (!user) return
  const { email, id, username } = user
  db.prepare(
    `
    INSERT INTO users (user_id, email, username)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET email = excluded.email, username = excluded.username
    `
  ).run(String(id), email, username ?? null)
}

export async function setStore(session: SessionProps) {
  const {
    access_token: accessToken,
    context,
    scope,
    user: { id },
  } = session
  if (!accessToken || !scope) return
  const storeHash = context?.split('/')[1] || ''
  db.prepare(
    `
    INSERT INTO stores (store_hash, access_token, scope, admin_id)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(store_hash) DO UPDATE SET access_token = excluded.access_token, scope = excluded.scope, admin_id = excluded.admin_id
    `
  ).run(storeHash, accessToken, scope, id)
}

export async function setStoreUser(session: SessionProps) {
  const {
    access_token: accessToken,
    owner,
    user: { id: userId },
  } = session
  if (!userId) return
  const storeHash = getStoreHash(session)
  const isAdmin = accessToken ? 1 : owner?.id === userId ? 1 : 0
  db.prepare(
    `
    INSERT INTO store_users (user_id, store_hash, is_admin)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, store_hash) DO UPDATE SET is_admin = MAX(is_admin, excluded.is_admin)
    `
  ).run(String(userId), storeHash, isAdmin)
}

export async function hasStoreUser(storeHash: string, userId: string) {
  if (!storeHash || !userId) return false
  const row = db
    .prepare('SELECT 1 FROM store_users WHERE user_id = ? AND store_hash = ?')
    .get(userId, storeHash)

  return row !== undefined
}

export async function getStoreToken(storeHash: string) {
  if (!storeHash) return null
  const row = db
    .prepare('SELECT access_token FROM stores WHERE store_hash = ?')
    .get(storeHash) as { access_token: string } | undefined

  return row?.access_token ?? null
}

export async function deleteStore({ store_hash: storeHash }: SessionProps) {
  if (!storeHash) return
  db.prepare('DELETE FROM stores WHERE store_hash = ?').run(storeHash)
}

export async function deleteUser({ context, user, sub }: SessionProps) {
  const storeHash = (context ?? sub)?.split('/')[1] || ''
  db.prepare(
    'DELETE FROM store_users WHERE user_id = ? AND store_hash = ?'
  ).run(String(user?.id), storeHash)
}
