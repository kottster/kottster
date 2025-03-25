#!/bin/sh
set -e

echo "Starting in development mode..."
exec npm run dev -- --port 5480 --host 0.0.0.0