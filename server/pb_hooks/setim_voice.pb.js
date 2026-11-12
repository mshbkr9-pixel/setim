/// <reference path="../pb_data/types.d.ts" />
/* Voice logging for the "setim" app: the one address the phone assistant talks to.
   GET  /api/setim/voice   -> {ok:true, shortcut}       the app asks this to know the server side is switched on, and where
                                                        the ready-made Siri shortcut is (siri.json; empty until there is one)
   POST /api/setim/voice   {key, text, date?, lang?}    -> {ok, say}   `say` is the sentence the assistant speaks back
   POST /api/setim/voice   {key, kind:'health', date?, steps?, hr?, kcal?, sleep?}   -> {ok, say}   the day's numbers from the phone's health app (v14)
   Each handler runs in its own context (PocketBase rule), so everything it needs is loaded inside it from setim_voice_lib.js.
   Files in this folder: this file, setim_voice_lib.js (storage glue), siri.json (the link of the shared shortcut), voice.js (the
   understanding; copied from parts/voice.js by build.py) and exnames.json (the exercise names; written by build.py). */
routerAdd("GET", "/api/setim/voice", (e) => {
  const lib = require(`${__hooks}/setim_voice_lib.js`);
  return lib.info(e, { os: $os, hooks: __hooks, text: toString });
});

routerAdd("POST", "/api/setim/voice", (e) => {
  const lib = require(`${__hooks}/setim_voice_lib.js`);
  return lib.post(e, { app: $app, security: $security, os: $os, hooks: __hooks, text: toString, Record: Record });
}, $apis.bodyLimit(8192));      // one sentence and a code: anything larger is not ours
