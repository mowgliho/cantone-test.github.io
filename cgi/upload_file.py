#!/usr/bin/python
import sys
import os

data = sys.stdin.read()
lines = data.split('\n')
fn = os.path.join('data',lines[0].strip())
with open(fn,'w') as f:
  for i,line in enumerate(lines):
    if i != 0 and line:
      f.write(line)
      f.write('\n')

print("Content-type: text/plain\n")
print('wrote: ' + fn)
