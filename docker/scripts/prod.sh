#!/bin/sh
set -e

echo "Starting in production mode..."
echo "Building project first..."
npm run build
echo "Starting production server..."
exec npm run start