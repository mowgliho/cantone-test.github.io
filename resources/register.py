#!/usr/bin/python
import cgi, os
import os
import sys
import cgitb
import itertools
import json
import random

cgitb.enable()

PARTICIPANT_FILE = 'data/participants.tsv'
COLS = ['id','st','ambientDfs','visual','audio']

print("Content-type: text/plain\n")

form = cgi.FieldStorage()

data = {form[key].name: form[key].value for key in ['id','st','ambientDbfs']}

with open(PARTICIPANT_FILE, 'r') as f:
  participants = [{key:val for key,val in zip(COLS,line.strip().split('\t'))} for i, line in enumerate(f) if i > 0]

visual = ['none','idealized','data']
audio = ['exemplar','vocoded']

groups = set(['%s-%s' % (a,b) for a,b in itertools.product(visual,audio)])
groups.remove('none-vocoded')

counts = {x:0 for x in groups}

for participant in participants:
  # note don't check other fields
  if participant['id'] == data['id']:
    print(json.dumps({'visual': participant['visual'], 'audio': participant['audio']}))
    sys.exit();
  group = participant['visual'] + '-' + participant['audio']
  counts[group] += 1

if max(counts.values()) == min(counts.values()):
  group = random.choice(list(groups))
else:
  group = random.choice([k for k in groups if counts[k] < max(counts.values())])

params = group.split('-')
print(json.dumps({'visual': params[0], 'audio': params[1]}))

with open(PARTICIPANT_FILE, 'a') as f:
  f.write('\t'.join([data['id'], data['st'], data['ambientDbfs'], params[0], params[1]]) + '\n')
