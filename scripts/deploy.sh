#!/bin/sh
set -eu
pnpm build
release_dir=$(mktemp -d)
trap 'rm -rf "$release_dir"' EXIT
cp -R dist/. "$release_dir/"
touch "$release_dir/.nojekyll"
git -C "$release_dir" init -b gh-pages
git -C "$release_dir" add .
git -C "$release_dir" commit -m 'build(pages): publish static Linggle application'
git -C "$release_dir" remote add origin https://github.com/weifish0/linggle-lab.git
git -C "$release_dir" push --force origin gh-pages
