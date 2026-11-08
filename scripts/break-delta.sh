#!/bin/sh
# Usage: scripts/break-delta.sh <change dir> &, started before the archive run of scenario 13a. It waits for the first delta spec.md, then removes each "#### Scenario:" block (13a step 2)
for i in $(seq 1 6000); do
  f=$(ls "$1"/specs/*/spec.md 2>/dev/null | head -1)
  if [ -n "$f" ]; then
    sleep 0.05
    node -e 'const fs=require("fs");const f=process.argv[1];const o=fs.readFileSync(f,"utf8");let skip=false;const out=o.split("\n").filter(l=>{if(/^#### Scenario:/.test(l)){skip=true;return false}if(skip&&/^#{1,3} /.test(l))skip=false;return !skip});fs.writeFileSync(f,out.join("\n"));console.log("BROKE",f,new Date().toISOString())' "$f"
    exit 0
  fi
  sleep 0.1
done
echo TIMEOUT
