#!/bin/bash
# Gallery — template catalog
set -e
export PATH="/Users/petrilahdelma/.nvm/versions/node/v20.19.2/bin:$PATH"
# Use a clean HOME so user-local templates under ~/.project-spine/templates
# don't leak into the capture.
export HOME=$(mktemp -d)
cd "$(mktemp -d)"
clear
spine template list
