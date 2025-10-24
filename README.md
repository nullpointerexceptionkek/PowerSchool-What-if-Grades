# PowerSchool What-if grade

Brings Canvas what if Grades into powerschool

Feature request and Bug reports are more than welcome, please open an issue.

**NOTE: I no longer have access to powerschool and thus unable to add any more new features or fix any bugs. Still let me know if there is any bugs and maybe I can figure out a way to fix**
![demo](/image.png)

## Instructions

Paste the entire [`paste.js`](/paste.js) into your browser console. You can open the console by pressing `F12`.

Or, you can also simply paste this script in the browser console or book mark it:
```js
javascript:(async()=>{try{const t=await fetch("https://raw.githubusercontent.com/nullpointerexceptionkek/PowerSchool-WhatIF-Grades/refs/heads/master/paste.js");if(!t.ok)throw 0;const a=await t.text(),e=await crypto.subtle.digest("SHA-256",(new TextEncoder).encode(a));"3a7ad2f48d7af5295fb14de1a13aa0dcddc9b5df91842caf498cd5c23831cabc"===Array.from(new Uint8Array(e)).map((t=>t.toString(16).padStart(2,"0"))).join("")?new Function(a)():console.error("HASH MISMATCH")}catch(t){}})();
```

## Features

1. We automatically query your grades so you do not have to manually input anything
2. We support both weighted and unweighted grade calculation
3. No Download Required, this is not an extension, simply paste the script


## License

MIT License
