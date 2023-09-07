#!/usr/bin/env node
/* eslint-disable no-console */

import fs from 'fs'
import path from 'path'
import watch from 'glob-watcher'
import WebSocket = require('ws')
import { Message } from '../src/utils'

function log(...arg: any[]) {
  console.log('[MV3-HOT-RELOAD]:', ...arg)
}

interface Config {
  port?: number
  globs?: string | string[]
}

let port = 9012
let globs: string | string[] = ['./dist/*']
const quiet = !!process.env.QUIET
const configs = ['mv3-hot-reload.config.js', 'mv3-hot-reload.config.cjs', 'mv3-hot-reload.config.mjs']
try {
  let CONFIG_PATH = ''
  configs.forEach((filename) => {
    if (fs.existsSync(path.resolve(filename))) {
      CONFIG_PATH = path.resolve(filename)
    }
  })
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const config: Config = require(CONFIG_PATH)
  port = config.port || port
  globs = config.globs || globs
} catch (err) {
  // ignore
}

const wss = new WebSocket.Server({ port })

wss.on('listening', () => {
  log('server is listening...')
})

wss.on('close', () => {
  log('server closed.')
})

wss.on('error', () => {
  log('server error.')
})

wss.on('connection', (ws) => {
  log('server connected.')
  const watcher = watch(globs, { ignoreInitial: true }, function (done) {
    done()
  })

  watcher.on('all', function (name, file) {
    if (!quiet) {
      log(`${name}`, file)
    }
    ws.send(Message.FileChange)
  })

  ws.on('close', () => {
    watcher.close()
  })
})
