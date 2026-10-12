# rcoiowa.org cutover record

Observed October 8, 2026. This file records preparation, not completed propagation.

## Prepared in Cloudflare
Account: 499272c2f0336cc60207bad24edd0e14
Zone: 8b436381cab9b6bfbfa5ec87559818d6 (pending)
Worker: rco-iowa-public
Custom domains: rcoiowa.org and www.rcoiowa.org, attached successfully.
Required registrar nameservers:
- candy.ns.cloudflare.com
- devin.ns.cloudflare.com

Current delegation is ns4.wixdns.net and ns5.wixdns.net. Cloudflare reports underlying registrar Tucows Domains Inc.; the purchasing reseller/account still needs identification. A Wix connected-domain setup lookup returned not found, which does not by itself prove registrar ownership.

## Preserved DNS
Wix DNS was readable in the connected RecoveryOS account. Its Google MX priorities 10/20/30/40/50, SPF TXT and Google verification TXT were copied into the pending Cloudflare zone and read back. Old apex A was 89.106.200.1. Old NS/SOA were not copied; Cloudflare manages these. Worker custom domains generated their own managed DNS entries. No live Wix DNS record was changed.

## Remaining action
Change registrar delegation to the two assigned Cloudflare nameservers, then wait for active zone status and certificate readiness. The available connectors do not expose a confirmed registrar nameserver operation. If purchased through Wix, its documented nameserver restriction may require a registrar transfer; do not initiate transfer, spend money, disable renewal or unlock the domain without a concrete approved transfer plan. Merely changing NS records inside Wix's DNS zone is not registrar delegation.

## Verify after delegation
1. Authoritative NS resolves to the assigned Cloudflare pair.
2. Both HTTPS hostnames return the approved RCO Iowa page and correct assets without redirecting to the older GFA initiative page.
3. Certificates validate for both hostnames.
4. All five MX records, SPF and verification TXT match the saved baseline; test mail with the owner if authorized.
5. Required RecoveryOS and community-center links work.
6. Intake remains disabled until the Supabase secret/Turnstile checks and a real acceptance test succeed; domain cutover does not activate it.

## Rollback
Restore registrar delegation to ns4.wixdns.net and ns5.wixdns.net if the cutover cannot be completed. Existing Wix DNS was preserved. DNS caches can delay rollback. Do not delete either zone or cancel Wix registration/mail services during verification.

References:
- https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- https://www.wix.com/blog/use-wix-just-as-a-domain-registrar
