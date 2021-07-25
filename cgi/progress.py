#!/usr/bin/python3
import pathlib
import cgi, os
import os
import cgitb
import json

DATA = 'data'
PROGRESS = 'progress.txt'

cgitb.enable()

form = cgi.FieldStorage()

info = {x: form[x].value for x in ['id','task','status']}

fn = os.path.join(DATA, info['id'], PROGRESS)

if not os.path.exists(fn):
  pathlib.Path(fn).touch()

with open(fn,'a') as f:
  f.write('%s\t%s\n' % (info['task'],info['status']))

print("Content-type: text/plain\n")
print(json.dumps(info))
