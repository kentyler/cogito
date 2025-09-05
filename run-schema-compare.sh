#!/bin/bash
source .env
export DEV_DATABASE_URL="$DEV_DATABASE_URL"
export PROD_DATABASE_URL="$DATABASE_URL"
node scripts/database/compare-schemas.js