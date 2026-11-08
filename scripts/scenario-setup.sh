#!/bin/sh
# Usage: scripts/scenario-setup.sh <label> [fixture]
# Builds a new, isolated start state for one scenario run, and prints its folder.
# Without a fixture: a fresh repo with openspec-lite installed (scenarios 1 and 2).
# With a fixture from tests/fixtures/scenarios/: the schema is installed too, and the fixture's openspec/ is copied in.
set -e
R=$(cd "$(dirname "$0")/.." && pwd)
d=$(mktemp -d "/tmp/osl-$1.XXXX"); cd "$d"
git init -q; openspec init --tools claude >/dev/null 2>&1
apm install "$R/package" --target claude >/dev/null 2>&1
for k in apply archive propose schema tasks-preview upgrade; do diff -rq "$R/package/skills/openspec-lite-$k" ".claude/skills/openspec-lite-$k"; done
if [ -n "$2" ]; then
  node .claude/skills/openspec-lite-schema/scripts/install.mjs . >/dev/null
  cp -R "$R/tests/fixtures/scenarios/$2/openspec/." openspec/
fi
git add -A; git -c user.name=setup -c user.email=setup@example.com commit -qm setup
echo "$d"
