#!/usr/bin/env node
// Generate a bcrypt hash for APP_PASSWORD.
// Usage: node scripts/hash-password.mjs "<password>"
import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-password.mjs "<password>"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
// bcrypt hashes contain "$", which .env parsers and docker-compose treat as
// variable interpolation. Single-quote in .env; double every "$" in compose.
const composeSafe = hash.split("$").join("$$");

console.log("\n.env (single-quote it — bcrypt hashes contain $):\n");
console.log(`APP_PASSWORD='${hash}'`);
console.log("\ndocker-compose.yml (every $ doubled to $$):\n");
console.log(`  APP_PASSWORD: '${composeSafe}'`);
console.log();
