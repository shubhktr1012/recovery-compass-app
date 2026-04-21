# Enquiry Form Conversion Design

## Goal
Replace the homepage waitlist flow with a general enquiry flow that is honest in naming, lightweight for visitors, and operationally useful for the team.

## Scope
- Replace the website waitlist submission flow with an enquiries flow.
- Change the main homepage form to collect name, email, optional phone, and message.
- Store enquiries in Supabase.
- Send a best-effort email notification to the internal enquiries inbox.
- Show a success toast/notice to the visitor after submit.
- Update homepage CTA copy and docs to reflect enquiries rather than waitlist.

## Decisions
- Use a new `public.enquiries` table instead of repurposing `waitlist`.
- Allow multiple enquiries from the same email.
- Keep email delivery best effort so database capture is the source of truth.
- Keep the footer CTA lightweight by scrolling to the main enquiry section instead of submitting a second form.

## Data Model
`public.enquiries`
- `id uuid primary key`
- `name text not null`
- `email text not null`
- `phone text null`
- `message text not null`
- `created_at timestamptz not null default now()`

RLS:
- public insert allowed
- service role select allowed

## Request Flow
1. Homepage form posts to `POST /api/enquiries`.
2. API validates the payload.
3. API inserts into `public.enquiries` using the server admin client.
4. API sends a best-effort Resend notification email to the configured internal inbox.
5. Frontend shows success toast/notice and resets the form.

## UX
- Primary CTA wording shifts from waitlist to enquiry language.
- Main CTA section becomes a contact/enquiry section.
- Success feedback is immediate and lightweight.
- Errors remain inline and simple.

## Operational Notes
- Add `ENQUIRY_ALERT_EMAILS` env var for the destination inbox.
- Keep the older waitlist table untouched for now; do not depend on it anymore.
