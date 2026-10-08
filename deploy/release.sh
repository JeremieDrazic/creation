#!/usr/bin/env bash
# Installed in the project-owned directory; CI's dedicated SSH key invokes this script only.
set -euo pipefail
PROJECT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
cd "$PROJECT_DIR"
exec 9> .release.lock
flock -w 300 9

REQUEST=${SSH_ORIGINAL_COMMAND:-${1:-}}
if [[ "$REQUEST" =~ ^deploy\ ([a-f0-9]{40})$ ]]; then
  RELEASE_SHA=${BASH_REMATCH[1]}
  NEXT_IMAGE="creation-static:$RELEASE_SHA"
  # Accept the immutable image checked by CI; no build happens on the VPS.
  gzip --decompress --stdout | docker load
  ACTUAL_SHA=$(docker image inspect "$NEXT_IMAGE" --format '{{index .Config.Labels "org.opencontainers.image.revision"}}')
  [[ "$ACTUAL_SHA" == "$RELEASE_SHA" ]]
elif [[ "$REQUEST" == rollback ]] && [[ -s previous-image ]]; then
  NEXT_IMAGE=$(cat previous-image)
else
  printf 'Unsupported release request.\n' >&2
  exit 1
fi
PREVIOUS_IMAGE=$(cat current-image 2>/dev/null || true)
export CREATION_IMAGE="$NEXT_IMAGE"
if ! docker compose -f compose.yml up --detach --wait --wait-timeout 90; then
  if [[ -n "$PREVIOUS_IMAGE" ]]; then
    CREATION_IMAGE="$PREVIOUS_IMAGE" docker compose -f compose.yml up --detach --wait --wait-timeout 90
  fi
  exit 1
fi
# Commit release pointers only after Docker health and the three public entry points pass.
for PATHNAME in / /docs/ /design-system/; do
  if ! curl --silent --show-error --fail --retry 12 --retry-delay 5 --retry-all-errors --max-time 10 \
    "https://creation.jerem.io$PATHNAME" >/dev/null; then
    if [[ -n "$PREVIOUS_IMAGE" ]]; then
      CREATION_IMAGE="$PREVIOUS_IMAGE" docker compose -f compose.yml up --detach --wait --wait-timeout 90
    fi
    exit 1
  fi
done
if [[ -n "$PREVIOUS_IMAGE" ]] && [[ "$NEXT_IMAGE" != "$PREVIOUS_IMAGE" ]]; then
  printf '%s\n' "$PREVIOUS_IMAGE" > previous-image.next
  mv previous-image.next previous-image
fi
printf '%s\n' "$NEXT_IMAGE" > current-image.next
mv current-image.next current-image
printf 'Verified release: %s\n' "$NEXT_IMAGE"
