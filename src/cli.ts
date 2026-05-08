#!/usr/bin/env node

import { Command } from 'commander'
import { create } from './commands/create.js'

const program = new Command()

program
  .name('webexter')
  .description('A scaffolding CLI for quickly building browser extensions')
  .version('1.0.0')

program
  .command('create')
  .description('Create a new browser extension project')
  .argument('<name>', 'project name')
  .action(async (name: string) => {
    await create(name)
  })

program.parse()
