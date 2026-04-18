#!/usr/bin/env bash
set -euo pipefail

BRANCH_NAME="Updated-Full-Frontend"
REPO_URL="https://github.com/Nogiback/PantryPal.git"
COMMIT_MESSAGE="${1:-Update full frontend}"

SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UPLOAD_DIR="${SOURCE_DIR}/PantryPal-upload"

echo "Uploading ${SOURCE_DIR} to ${BRANCH_NAME}..."

if [ ! -d "${UPLOAD_DIR}/.git" ]; then
  git clone "${REPO_URL}" "${UPLOAD_DIR}"
fi

cd "${UPLOAD_DIR}"
git remote set-url origin "${REPO_URL}" 2>/dev/null || git remote add origin "${REPO_URL}"
git fetch origin

if git show-ref --verify --quiet "refs/heads/${BRANCH_NAME}"; then
  git switch "${BRANCH_NAME}"
elif git show-ref --verify --quiet "refs/remotes/origin/${BRANCH_NAME}"; then
  git switch -c "${BRANCH_NAME}" --track "origin/${BRANCH_NAME}"
else
  git switch -c "${BRANCH_NAME}"
fi

rsync -a \
  --exclude node_modules \
  --exclude dist \
  --exclude .git \
  --exclude PantryPal-upload \
  --exclude .DS_Store \
  "${SOURCE_DIR}/" \
  "${UPLOAD_DIR}/"

git add .

if git diff --cached --quiet; then
  echo "No new changes to commit."
else
  git commit -m "${COMMIT_MESSAGE}"
fi

git push -u origin "${BRANCH_NAME}"
echo "Done."
