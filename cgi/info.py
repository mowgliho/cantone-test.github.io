#!/usr/bin/python3
import cgi
import os
import cgitb
import json

DATA = 'data'
INFO = 'info.txt'

try:
  cgitb.enable()
  form = cgi.FieldStorage()

  pid = form['id'].value

  fn = os.path.join(DATA, pid, INFO)
  data = {}

  with open(fn,'r') as f:
    for line in f.readlines():
      tokens = line.strip().split('\t')
      data[tokens[0]] = tokens[1]

  print("Content-type: text/plain\n")
  print(json.dumps({'data': data}))
except Exception as e:
  print("Content-type: text/plain\n")
  print(json.dumps({'data': None, 'error': str(e)}))
