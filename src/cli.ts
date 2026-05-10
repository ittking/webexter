#!/usr/bin/env node
/*
 * @Author: mnwm mnwm@noreply.gitcode.com
 * @Date: 2026-05-09 14:37:39
 * @LastEditors: mnwm mnwm@noreply.gitcode.com
 * @LastEditTime: 2026-05-09 14:37:53
 * @FilePath: /webexter/src/cli.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

import { Command } from 'commander'
import { create } from './commands/create.js'
import pkg from '../package.json' with { type: 'json' }

const program = new Command()

program
  .name('webexter')
  .description('A scaffolding CLI for quickly building browser extensions')
  .version(pkg.version)

program
  .command('create')
  .description('Create a new browser extension project')
  .argument('<name>', 'project name')
  .action(async (name: string) => {
    await create(name)
  })

program.parse()
