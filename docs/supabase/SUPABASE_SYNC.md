# Supabase sync data contract

The extension continues to use IndexedDB as its local source of truth. The current demo sign-in is local-only; no Supabase credentials or network sync are configured in the addon.

## Compact cloud shape

- Store each page once in `public.pages`, unique by `(user_id, url)`. This avoids repeating URL, hostname, title, and thumbnail for every highlight on that page.
- Store each highlight/note in `public.annotations`, keeping its existing UUID as the row ID and referencing the page with `page_id`.
- Keep tags as `text[]`, review state as `jsonb`, and timestamps as UTC values. Do not upload extension-only presentation state.
- Preserve deletions as `deleted_at` tombstones until the server confirms the change, so offline deletions can sync later.

The SQL setup, including owner-only row-level security policies and query indexes, is in `supabase-schema.sql`.

## Sync batching

1. Upsert changed pages first, in batches of 250, and build a local URL-to-page-ID map.
2. Upsert annotation rows in batches of 250, preserving their UUIDs.
3. Pull changes in stable `(updated_at, id)` order and store the last acknowledged cursor locally.
4. Clear a tombstone or dirty marker only after Supabase confirms the batch. Retry with the same IDs so an interrupted request is safe to repeat.

Use the Supabase publishable/anon key in the client only with authenticated sessions and the supplied RLS policies. Never place a service-role key in the extension.
