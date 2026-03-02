set -e

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm use v22.13.0

echo "→ Press 'w' to open the web browser"
echo ""

npx expo start --web --port 8081