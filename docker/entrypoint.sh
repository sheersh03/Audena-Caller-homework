#!/bin/sh
set -e

echo "Running prisma db push..."
npx prisma db push

echo "Starting app..."
exec node server.js
