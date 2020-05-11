#!/usr/bin/env bash

echo Installing npm dependencies..
npm install
echo ..Done

# load variables from .env
set -o allexport
source .env
MYSQL_PWD=$DB_PASSWORD
set +o allexport

DB=${DB_NAME}_${NODE_ENV}

# reset database and create tables
echo Setting up database..
mysql -u$DB_USER -h$DB_HOST -e "
DROP DATABASE IF EXISTS $DB;
CREATE DATABASE $DB;
USE $DB;
SOURCE setup-tables.sql
";
echo ..Done

jest --runInBand

echo Dropping ${NODE_ENV} database..
mysql -u$DB_USER -h$DB_HOST -e "
DROP DATABASE $DB;
";
echo ..Dropped
