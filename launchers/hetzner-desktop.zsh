#!/bin/zsh
if [[ -z ${HETZNER_API_TOKEN:-} ]]; then
  print -u2 -- 'HETZNER_API_TOKEN is required in the zsh startup environment'
  exit 1
fi
zmodload zsh/parameter
export PATH="$HOME/.bun/bin:/usr/bin:/bin"
for name in ${(k)parameters}; do
  case "$name" in
    HOME|PATH|TMPDIR|LANG|HETZNER_API_TOKEN) ;;
    *)
      if [[ ${parameters[$name]} == *export* ]]; then
        unset "$name"
      fi
      ;;
  esac
done
exec "$HOME/.bun/bin/bunx" -y @jurislm/hetzner-plugin@latest
