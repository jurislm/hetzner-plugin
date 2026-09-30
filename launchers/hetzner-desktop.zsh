#!/bin/zsh -f
if [[ -r ${ZDOTDIR:-$HOME}/.zshenv ]]; then
  /bin/zsh -f -n "${ZDOTDIR:-$HOME}/.zshenv" || exit $?
  startup_status=0
  source "${ZDOTDIR:-$HOME}/.zshenv" >/dev/null || startup_status=$?
  if (( startup_status > 1 )); then
    exit "$startup_status"
  fi
fi
if [[ -z ${HETZNER_API_TOKEN:-} ]]; then
  print -u2 -- 'HETZNER_API_TOKEN is required in the zsh startup environment'
  exit 1
fi
zmodload zsh/parameter
export PATH="$HOME/.bun/bin:/usr/bin:/bin"
for name in ${(k)parameters}; do
  case "$name" in
    HOME|PATH|TMPDIR|LANG|SSH_AUTH_SOCK|HETZNER_API_TOKEN) ;;
    *)
      if [[ ${parameters[$name]} == *export* ]]; then
        unset "$name"
      fi
      ;;
  esac
done
exec "$HOME/.bun/bin/bunx" -y @jurislm/hetzner-plugin@latest
