#!/usr/bin/env bash
set -euo pipefail
IMAGE=${1:?Supply the built image}
CONTAINER="creation-smoke-$$"
cleanup() { docker rm -f "$CONTAINER" >/dev/null 2>&1 || true; }
trap cleanup EXIT

docker run --detach --name "$CONTAINER" --read-only --tmpfs /tmp --cap-drop ALL \
  --security-opt no-new-privileges:true --memory 128m --pids-limit 64 \
  --publish 127.0.0.1::8080 "$IMAGE" >/dev/null
PORT=$(docker port "$CONTAINER" 8080/tcp | sed 's/.*://')
ORIGIN="http://127.0.0.1:$PORT"
for ATTEMPT in {1..20}; do
  if curl --silent --fail "$ORIGIN/healthz" >/dev/null; then break; fi
  sleep 1
done
for PATHNAME in / /fireflies /docs/ /docs/standards.html /design-system/ /design-system/iframe.html; do
  curl --silent --show-error --fail "$ORIGIN$PATHNAME" >/dev/null
done
for PATHNAME in /docs /design-system; do
  HEADERS=$(curl --silent --show-error --head "$ORIGIN$PATHNAME")
  [[ "$HEADERS" == *'308 Permanent Redirect'* ]]
  [[ "$HEADERS" == *"Location: $PATHNAME/"* ]]
done
for PATHNAME in /assets/missing.js /docs/missing.html /design-system/missing.js; do
  STATUS=$(curl --silent --output /dev/null --write-out '%{http_code}' "$ORIGIN$PATHNAME")
  [[ "$STATUS" == '404' ]]
done
printf 'Static container routes, redirects and missing assets verified.\n'
