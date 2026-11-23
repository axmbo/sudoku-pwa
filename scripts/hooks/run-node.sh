#!/usr/bin/env sh
# Executa o comando com o Node do .nvmrc: hooks do git não herdam o `nvm use` do terminal.
set -eu
cd "$(git rev-parse --show-toplevel)"
if [ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]; then
  . "${NVM_DIR:-$HOME/.nvm}/nvm.sh" >/dev/null
  nvm use >/dev/null
fi
exec "$@"
