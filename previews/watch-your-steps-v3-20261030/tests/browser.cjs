'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const candidates=[process.env.PLAYWRIGHT_PYTHON,'/opt/anaconda3/bin/python','python3'].filter(Boolean);
const python=candidates.find(candidate=>spawnSync(candidate,['-c','import playwright'],{stdio:'ignore'}).status===0);
if(!python)throw Error('Python Playwright is required. Set PLAYWRIGHT_PYTHON to its interpreter.');
const script=path.join(__dirname,'v3-review.py');
if(!fs.existsSync(script))throw Error('The iteration 3 review script is missing.');
const result=spawnSync(python,[script,'--url',process.env.UPSTAIRS_URL||'http://127.0.0.1:8770/',...process.argv.slice(2)],{stdio:'inherit',env:process.env});
process.exitCode=result.status??1;
