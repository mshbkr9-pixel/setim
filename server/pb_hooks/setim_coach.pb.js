/// <reference path="../pb_data/types.d.ts" />
/* The coach of the "setim" app: the one place that holds the Claude API key and talks to the model.
   GET  /api/setim/coach         -> {ok, on, access, owner, left, limit}   is the coach switched on here, was this person invited,
                                    and how many answers they have left today
   POST /api/setim/coach         {text, hist, snap, img?, pref?, lastTier?}   -> {ok, say, acts, tier, model, left}
   POST /api/setim/coach/join    {code}   an invitation link was opened: the signed-in person gets the coach (one link, one account)
   POST /api/setim/coach/admin   {do: state | invite | revoke | limits}   the owner only: who is in, a new link, the daily limits
   Only a signed-in person who was invited may ask. The app answers what it can by itself and sends here only what needs a model;
   this side decides which model (the complexity score in coach.js), keeps the daily limits, and never writes the person's
   documents: what the model proposes goes back to the app as "acts", and the person confirms each one there.
   Files in this folder for it: this file, setim_coach_lib.js (who may ask, limits, the call, the bookkeeping), coach.js (score,
   request, checks; copied from parts/coach.js by build.py), coach_catalog.json (the recipe list the model may choose from; written
   by build.py) and coach.json (the knobs: models, score cuts, limits, daily budget). The key itself is not here: it comes from the
   environment. */
routerAdd("GET", "/api/setim/coach", (e) => {
  const lib = require(`${__hooks}/setim_coach_lib.js`);
  return lib.info(e, { app: $app, os: $os, hooks: __hooks, text: toString });
});

routerAdd("POST", "/api/setim/coach", (e) => {
  const lib = require(`${__hooks}/setim_coach_lib.js`);
  return lib.post(e, { app: $app, os: $os, http: $http, hooks: __hooks, text: toString, Record: Record, sleep: sleep });
}, $apis.bodyLimit(4 * 1024 * 1024));      // a sentence, a short history, a summary of the person's data and at most one reduced photo

routerAdd("POST", "/api/setim/coach/join", (e) => {
  const lib = require(`${__hooks}/setim_coach_lib.js`);
  return lib.join(e, { app: $app, os: $os, hooks: __hooks, text: toString, Record: Record, security: $security });
}, $apis.bodyLimit(4 * 1024));

routerAdd("POST", "/api/setim/coach/admin", (e) => {
  const lib = require(`${__hooks}/setim_coach_lib.js`);
  return lib.admin(e, { app: $app, os: $os, hooks: __hooks, text: toString, Record: Record, security: $security });
}, $apis.bodyLimit(4 * 1024));
