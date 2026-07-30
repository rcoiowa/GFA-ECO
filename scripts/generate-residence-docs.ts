/**
 * Generate derived artifacts from the canonical document library
 * (packages/residence-content):
 *
 *   1. supabase/seed/documents_seed.sql — idempotent upserts into
 *      document_templates / document_versions so residents can review and
 *      sign digitally.
 *   2. docs/residence-documents/*.md — the printable set for binders,
 *      move-in packets, and certification evidence, plus an index.
 *
 * Run after any content change:  pnpm generate:residence-docs
 * Never edit the generated files by hand.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { allDocuments } from '@recoveryos/residence-content';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// --- Seed SQL --------------------------------------------------------------

function sqlLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function dollarQuote(body: string): string {
  let tag = 'docbody';
  while (body.includes(`$${tag}$`)) tag += '_x';
  return `$${tag}$${body}$${tag}$`;
}

const seedHeader = `-- GENERATED FILE — do not edit.
-- Source: packages/residence-content (pnpm generate:residence-docs).
-- Idempotent: safe to re-run; re-publishing an existing version updates
-- its body only if the version string was bumped (bodies are immutable
-- per version by design — bump the version to change a document).
set search_path = recoveryos, public;

`;

const templateBlocks = allDocuments
  .map(
    (d) => `insert into document_templates (organization_id, key, name, requires_signature)
select o.id, ${sqlLiteral(d.key)}, ${sqlLiteral(d.name)}, ${d.requiresSignature}
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, ${sqlLiteral(d.version)}, ${dollarQuote(d.body)}, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = ${sqlLiteral(d.key)}
on conflict (template_id, version) do nothing;
`,
  )
  .join('\n');

const seedPath = join(root, 'supabase/seed/documents_seed.sql');
writeFileSync(seedPath, seedHeader + templateBlocks + "\nnotify pgrst, 'reload schema';\n");

// --- Printable markdown ----------------------------------------------------

const docsDir = join(root, 'docs/residence-documents');
mkdirSync(docsDir, { recursive: true });

for (const d of allDocuments) {
  const frontMatter = `<!-- GENERATED from packages/residence-content — do not edit by hand. -->

`;
  const compliance = `
---

*Compliance references — verify clause codes against the certifying
affiliate's current NARR 3.0 workbook and Iowa HHS form 470-0025:*

${d.narrReferences.map((r) => `- NARR 3.0: ${r}`).join('\n')}
${d.iowaChecklist.map((r) => `- Iowa HHS checklist: ${r}`).join('\n')}
`;
  writeFileSync(join(docsDir, `${d.key}.md`), frontMatter + d.body + compliance);
}

const categoryNames: Record<string, string> = {
  agreement: 'Agreements (signed at move-in)',
  rights: 'Rights',
  policy: 'Policies',
  form: 'Forms',
};

const indexBody = `<!-- GENERATED from packages/residence-content — do not edit by hand. -->

# Residence Document Library

The complete Grace House document set — printable versions of the
canonical library in \`packages/residence-content\`. Regenerate with
\`pnpm generate:residence-docs\`.

${(['agreement', 'rights', 'policy', 'form'] as const)
  .map(
    (cat) => `## ${categoryNames[cat]}

| Document | Version | Summary |
| --- | --- | --- |
${allDocuments
  .filter((d) => d.category === cat)
  .map((d) => `| [${d.name}](./${d.key}.md) | ${d.version} | ${d.summary} |`)
  .join('\n')}`,
  )
  .join('\n\n')}
`;
writeFileSync(join(docsDir, 'README.md'), indexBody);

console.log(
  `Generated ${allDocuments.length} documents → docs/residence-documents/ and supabase/seed/documents_seed.sql`,
);
