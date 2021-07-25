#!/usr/bin/python3
import sys
import os
import cgi
import cgitb

try: 
  cgitb.enable()
  form = cgi.FieldStorage()
  info = {x: form[x].value for x in ['id','filename','text', 'append']}

  with open(os.path.join('data',info['id'],info['filename']),'a' if info['append'] == 'true' else 'w') as f:
    f.write(info['text'])

  print("Content-type: text/plain\n")
  print('wrote: %s %s' % (info['id'], info['filename']))
except Exception as e:
  print("Content-type: text/plain\n")
  print(str(e))
