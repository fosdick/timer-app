#!/usr/bin/env bash
#
# Run the Maestro E2E flows. Self-sufficient: npm scripts run via `sh -c` and do
# NOT source your interactive shell, so Maestro (installed to ~/.maestro/bin) and
# the JDK Maestro needs are wired up here rather than relying on PATH/JAVA_HOME
# being exported in the calling terminal.
#
set -euo pipefail
cd "$(dirname "$0")/.."

# Maestro CLI — the curl installer puts it here; not always on the npm PATH.
[ -d "$HOME/.maestro/bin" ] && export PATH="$HOME/.maestro/bin:$PATH"

# Maestro needs a JDK. NOTE: macOS ships a /usr/bin/java *stub* that exists but
# only nags you to install Java — so we can't trust `command -v java`. Resolve a
# real JDK_HOME and prepend its bin so it shadows the stub. /usr/libexec/java_home
# succeeds only if a real JDK is registered; otherwise fall back to a Temurin JDK
# unpacked under ~/.jdks (how this machine got Java without a working Homebrew —
# see .maestro/README.md).
if [ -z "${JAVA_HOME:-}" ]; then
  if jh="$(/usr/libexec/java_home 2>/dev/null)"; then
    export JAVA_HOME="$jh"
  else
    jdk="$(ls -d "$HOME"/.jdks/*/Contents/Home 2>/dev/null | head -1 || true)"
    [ -n "$jdk" ] && export JAVA_HOME="$jdk"
  fi
fi
[ -n "${JAVA_HOME:-}" ] && export PATH="$JAVA_HOME/bin:$PATH"

if ! command -v maestro >/dev/null 2>&1; then
  echo "maestro not found. Install it:" >&2
  echo "  brew install mobile-dev-inc/tap/maestro   # or:" >&2
  echo "  curl -Ls https://get.maestro.mobile.dev | bash" >&2
  exit 127
fi

maestro test .maestro "$@"
status=$?

# Tests done — quit the simulator (shut down the device + close the app).
xcrun simctl shutdown booted >/dev/null 2>&1 || true
osascript -e 'quit app "Simulator"' >/dev/null 2>&1 || true

exit $status
