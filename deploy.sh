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
echo "To connect vrcc.app domain:"
echo "  Add CNAME: vrcc.app → grace-vrcc.workers.dev"
echo "  Add route in wrangler.toml (already configured)"
