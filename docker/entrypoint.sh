#!/bin/sh
set -e

echo "Running prisma db push..."
npx prisma db push

echo "Starting app..."
node server.js
