#!/usr/bin/env bash

# load variables from .env
set -o allexport
source .env
set +o allexport

# start msql
mysql.server start

# reset database and create tables
mysql --verbose -u$DB_USER -p$DB_PASSWORD -e "
DROP DATABASE IF EXISTS $DB_NAME;
CREATE DATABASE $DB_NAME;
USE $DB_NAME;
SOURCE setup-tables.sql
";
