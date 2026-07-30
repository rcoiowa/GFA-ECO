# Architecture Decision Records

| ADR  | Decision                                                                     | Status             |
| ---- | ---------------------------------------------------------------------------- | ------------------ |
| 0001 | Hybrid architecture: shared foundation + separate experience shells          | Accepted           |
| 0002 | Separate Cloudflare Pages apps per experience                                | Superseded by 0010 |
| 0003 | Person ≠ account: auth.users → people → relationships                        | Accepted           |
| 0004 | bigint identity primary keys; no UUID PKs                                    | Accepted           |
| 0005 | service_events as the single service-attribution spine                       | Accepted           |
| 0006 | RLS is the authorization boundary; frontend guards are navigation only       | Accepted           |
| 0007 | Support Now ladder contacts are configuration pending authorized review      | Accepted           |
| 0008 | Internal packages consumed as TypeScript source (no per-package builds)      | Accepted           |
| 0009 | Consent history is append-only; latest grant wins                            | Accepted           |
| 0010 | One platform app with route-separated, lazy-loaded experience shells         | Accepted           |
| 0011 | Five source builds consolidate into the canonical platform                   | Accepted           |
| 0012 | Canonical residence document library as code; seeds and printables generated | Accepted           |
