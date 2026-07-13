#!/usr/bin/env node
import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-password.mjs "<password>"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);

console.log(`APP_PASSWORD=${hash.split("$").join("\\$")}`);
