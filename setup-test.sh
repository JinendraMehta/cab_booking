#!/usr/bin/env bash

echo DB_HOST: $DB_HOST
echo DB_PASSWORD: $DB_PASSWORD
echo DB_USER: $DB_USER

# load variables from .env
set -o allexport
source .env
MYSQL_PWD=$DB_PASSWORD

echo "Waiting for database..."

while ! mysqladmin ping -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" --silent; do
    sleep 5
done

DB=${DB_NAME}_${NODE_ENV}

# reset database and create tables
echo Setting up database..
mysql -u$DB_USER -h$DB_HOST -p$DB_PASSWORD -e "
DROP DATABASE IF EXISTS $DB;
CREATE DATABASE $DB;
USE $DB;
SOURCE setup-tables.sql
";
echo ..Done

jest --runInBand

echo Dropping ${NODE_ENV} database..
mysql -u$DB_USER -h$DB_HOST -p$DB_PASSWORD -e "
DROP DATABASE $DB;
";
echo ..Dropped
