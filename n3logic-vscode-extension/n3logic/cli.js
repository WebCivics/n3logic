#!/usr/bin/env node
// n3logic/cli.js
// Simple CLI for parsing, reasoning, and validating N3 Logic files


import { N3LogicParser } from './N3LogicParser.js';
import { N3LogicReasoner } from './N3LogicReasoner.js';
import fs from 'fs';

function printHelp() {
  console.log('N3Logic CLI\n\nUsage:\n  n3logic parse <file>\n  n3logic reason <file>\n');
}

async function main() {
  const [,, cmd, file] = process.argv;
  if (!cmd || !file) return printHelp();
  const data = fs.readFileSync(file, 'utf8');
  if (cmd === 'parse') {
    const parser = new N3LogicParser();
    const doc = parser.parse(data);
    console.log(JSON.stringify(doc, null, 2));
  } else if (cmd === 'reason') {
    const reasoner = new N3LogicReasoner();
    reasoner.loadOntology(data, 'n3');
    const result = reasoner.reason();
    console.log(JSON.stringify(result, null, 2));
  } else {
    printHelp();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
