# invite-member edge function

Creates a new authenticated user (with admin-set password, no email confirmation) and a matching `family_members` row. Caller must be an `Admin` in the target household.

## Deploy

```bash
# from finlens-app/
npx supabase login
npx supabase link --project-ref <YOUR_PROJECT_REF>
npx supabase functions deploy invite-member
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically. No `--no-verify-jwt` flag — the function reads the caller's JWT from `Authorization`.

## Local test

```bash
curl -X POST 'https://<project>.functions.supabase.co/invite-member' \
  -H "Authorization: Bearer <ANON_OR_USER_JWT>" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Yara","email":"yara@example.com","password":"abcd1234","role":"Member","relation":"Daughter · 14"}'
```
