#!/bin/bash

openssl rand -base64 700 > /auth/file.key
chmod 400 /auth/file.key
chown 999:999 /auth/file.key