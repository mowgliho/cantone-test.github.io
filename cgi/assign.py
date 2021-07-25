#!/usr/bin/python
import pathlib
import os
import uuid
import itertools
import json
import random

DATA = 'data'
INFO = 'info.txt'
FIELDS = ['id','audio','visual']

VISUAL = ['none','idealized','data']
AUDIO = ['exemplar','vocoded']

GROUPS = set(['%s-%s' % (a,b) for a,b in itertools.product(VISUAL,AUDIO)])
GROUPS.remove('none-vocoded')

# count existing
participants = {}
for folder in os.listdir(DATA):
  if os.path.isdir(os.path.join(DATA, folder)):
    filename = os.path.join(DATA,folder,INFO)
    if os.path.exists(filename):
      with open(filename,'r') as f:
        tokens = [line.strip().split('\t') for line in f.readlines()]
        if set([len(t) for t in tokens]) == {2}:
          info = {t[0]: t[1] for t in tokens}
          if all([a in info for a in FIELDS]):
            participants[folder] = info

counts = {x: 0 for x in GROUPS}

for p, info in participants.items():
  group = '%s-%s' % (info['visual'], info['audio'])
  if group in counts:
    counts[group] += 1

# assign new
p = str(uuid.uuid4())
group = random.choice([k for k in GROUPS if counts[k] == min(counts.values())])
visual, audio = group.split('-')

info = {'id':p, 'visual':visual, 'audio': audio}

# write to file
folder = os.path.join(DATA, p)
pathlib.Path(folder).mkdir(parents = True)

with open(os.path.join(folder, INFO),'w') as f:
  for key, value in info.items():
    f.write('%s\t%s\n' % (key, value))

# return output
print("Content-type: text/plain\n")
print(json.dumps(info))
