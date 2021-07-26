#!/usr/bin/python3
import sys
import os
import cgi
import cgitb
import json

try: 
  cgitb.enable()
  form = cgi.FieldStorage()
  pid = form['id'].value
  data = json.loads(form['data'].value)

  for d in data:
    with open(os.path.join('data',pid,d['filename']),'a' if d['append'] else 'w') as f:
      f.write(d['text'])

  print("Content-type: text/plain\n")
  print('wrote: %s %s' % (info['id'], [d['filename'] for d in data]))
except Exception as e:
  print("Content-type: text/plain\n")
  print(str(e))
