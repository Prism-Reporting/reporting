#!/usr/bin/env sh

set -eu

repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

if [ ! -d "$repo_root/.git" ]; then
  exit 0
fi

if [ -f "$repo_root/.githooks/pre-commit" ]; then
  chmod +x "$repo_root/.githooks/pre-commit"
fi

git -C "$repo_root" config core.hooksPath .githooks
