#!/usr/bin/env bash
# Exercise rollback without Docker, network access or production credentials.
set -euo pipefail
TEST_DIR=$(mktemp -d)
trap 'rm -rf "$TEST_DIR"' EXIT
mkdir "$TEST_DIR/bin"
# macOS lacks flock; this unit harness does not exercise process contention.
if ! command -v flock >/dev/null; then
  printf '#!/usr/bin/env bash\nexit 0\n' > "$TEST_DIR/bin/flock"
  chmod +x "$TEST_DIR/bin/flock"
fi
cp "$(dirname -- "${BASH_SOURCE[0]}")/release.sh" "$TEST_DIR/release.sh"
export TEST_LOG="$TEST_DIR/events"
export TEST_RELEASE_SHA=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
export TEST_OLD_IMAGE=creation-static:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
export TEST_FAIL_HEALTH=0 TEST_FAIL_HTTP=0
cat > "$TEST_DIR/bin/docker" <<'DOCKER'
#!/usr/bin/env bash
set -euo pipefail
printf '%s %s\n' "${CREATION_IMAGE:-none}" "$*" >> "$TEST_LOG"
if [[ "$1" == load ]]; then cat >/dev/null; fi
if [[ "$1 ${2:-}" == 'image inspect' ]]; then printf '%s\n' "$TEST_RELEASE_SHA"; fi
if [[ "$*" == *' up '* && "$TEST_FAIL_HEALTH" == 1 && "$CREATION_IMAGE" != "$TEST_OLD_IMAGE" ]]; then exit 1; fi
DOCKER
cat > "$TEST_DIR/bin/curl" <<'CURL'
#!/usr/bin/env bash
[[ "$TEST_FAIL_HTTP" == 0 ]]
CURL
chmod +x "$TEST_DIR/bin/docker" "$TEST_DIR/bin/curl"
export PATH="$TEST_DIR/bin:$PATH"
reset_release() {
  printf '%s\n' "$TEST_OLD_IMAGE" > "$TEST_DIR/current-image"
  rm -f "$TEST_DIR/previous-image"
  : > "$TEST_LOG"
}
request_release() {
  printf 'checked-image' | gzip | bash "$TEST_DIR/release.sh" "deploy $TEST_RELEASE_SHA"
}
reset_release
request_release
[[ $(cat "$TEST_DIR/current-image") == "creation-static:$TEST_RELEASE_SHA" ]]
[[ $(cat "$TEST_DIR/previous-image") == "$TEST_OLD_IMAGE" ]]
bash "$TEST_DIR/release.sh" rollback
[[ $(cat "$TEST_DIR/current-image") == "$TEST_OLD_IMAGE" ]]
for FAILURE in health http; do
  reset_release
  export TEST_FAIL_HEALTH=0 TEST_FAIL_HTTP=0
  if [[ "$FAILURE" == health ]]; then export TEST_FAIL_HEALTH=1; else export TEST_FAIL_HTTP=1; fi
  if request_release; then printf 'Expected release failure.\n' >&2; exit 1; fi
  [[ $(cat "$TEST_DIR/current-image") == "$TEST_OLD_IMAGE" ]]
  [[ $(tail -n 1 "$TEST_LOG") == "$TEST_OLD_IMAGE compose -f compose.yml up --detach --wait --wait-timeout 90" ]]
done
if bash "$TEST_DIR/release.sh" 'deploy invalid'; then exit 1; fi
printf 'Release success, rollback, health failure, HTTP failure and invalid requests verified.\n'
