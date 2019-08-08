#!/usr/bin/env node

const { resolve } = require('path')
const { argv, exit } = require('process')
const { spawn } = require('child_process')

const AWS = require('aws-sdk')
const { blue } = require('chalk')
const shortid = require('shortid')

require('dotenv').config({ path: resolve(__dirname, '.env') })

const regex = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi

const argc = argv.length
if (argc < 3 || argc > 4) {
  console.error('Usage: wln <URL> [id]')
  exit(1)
}

const URL = argv[2]
const ID = argc == 4 ? argv[3] : shortid.generate()
const NOW = Math.floor(+new Date() / 1000)

if (!URL.match(regex)) {
  console.error('ERROR: URL is not valid.')
  exit(1)
}

AWS.config.update({
  region: 'ap-northeast-2'
})

const docClient = new AWS.DynamoDB.DocumentClient()

var params = {
  TableName: process.env.DB_TABLE_NAME,
  Item: {
    id: ID,
    location: URL,
    date: NOW
  }
}

docClient
  .put(params)
  .promise()
  .then((res, err) => {
    if (err) {
      console.error('Error.')
      exit(1)
    }
    const resultURL = `https://${process.env.SERVER_HOSTNAME}/${ID}`
    const proc = spawn('pbcopy')
    proc.stdin.write(resultURL)
    proc.stdin.end()
    console.log('Success. Copied to clipboard.')
    console.log(blue(resultURL))
    exit(0)
  })
