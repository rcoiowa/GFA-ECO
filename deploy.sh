#!/bin/bash
# GFA VRCC — One-Command Cloudflare Deployment
# Run from the directory containing this script

echo "🚀 Deploying GFA Recovery OS to Cloudflare..."
echo ""

# Check wrangler installed
if ! command -v wrangler &> /dev/null; then
  echo "Installing Wrangler..."
  npm install -g wrangler
fi

# Login if needed
echo "Authenticating with Cloudflare..."
wrangler login

# Deploy
echo "Deploying Worker..."
wrangler deploy --name grace-vrcc

echo ""
echo "✦ Deployment complete!"
echo ""
echo "Your VRCC is live at:"
echo "  https://grace-vrcc.thomasdegarmeaux.workers.dev/"
echo ""
echo "Routes served:"
echo "  /               → VRCC Main Platform"
echo "  /architecture   → Grace AI Architecture"
echo "  /slogans        → Recovery Slogan Viewer"
echo "  /enneagram      → Enneagram Recovery Map"
echo "  /hub            → Navigation Hub"
echo ""
echo "⚠ Staging deploy only — the vrcc.app route is NOT wired up yet."
echo "  vrcc.app currently belongs to the live 'virtualrecovery' worker."
echo "  Review this deployment at the workers.dev URL above, then"
echo "  uncomment the [[routes]] block in wrangler.toml and redeploy"
echo "  once the vrcc.app cutover is explicitly confirmed."
