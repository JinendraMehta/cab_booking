#!/usr/bin/env bash

# load variables from .env
set -o allexport
source .env
set +o allexport

# reset database and create tables
mysql --verbose -u$DB_USER -p$DB_PASSWORD -h$DB_HOST -e "
DROP DATABASE IF EXISTS $DB_NAME;
CREATE DATABASE $DB_NAME;
USE $DB_NAME;
SOURCE setup-tables.sql
";

npm start
