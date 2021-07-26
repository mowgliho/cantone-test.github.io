#!/usr/bin/python3
import pathlib
import cgi
import os
import cgitb
import json

DATA = 'data'
PROGRESS = 'progress.txt'

try:
  cgitb.enable()
  form = cgi.FieldStorage()

  pid = form['id'].value

  fn = os.path.join(DATA, pid, PROGRESS)

  with open(fn,'r') as f:
    task, status, time = f.readlines()[-1].strip().split('\t')

  print("Content-type: text/plain\n")
  print(json.dumps({'task': task, 'status': status}))
except Exception as e:
  print("Content-type: text/plain\n")
  print(json.dumps({'task': None, 'status': None, 'error': str(e)}))
