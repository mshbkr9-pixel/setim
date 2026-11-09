const EQ = {none:'משקל גוף',dumbbell:'משקולות יד',barbell:'מוט',kettlebell:'קטלבל',cable:'כבלים',pull_up_bar:'מתח',ez_bar:'מוט EZ',smith_machine:"סמית'",flat_bench:'ספסל',loop_band:'גומייה',resistance_band:'גומיית התנגדות',suspension_trainer:'TRX',rings:'טבעות',bosu_ball:'בוסו',stability_ball:'כדור פיזיו',leg_press:'לג פרס',dip_station:'מקבילים',plates:'דיסקיות',leg_curl:'מכונת כפיפת ברכיים',dip_machine:'מכונת דיפס',battle_rope:'חבלי קרב',lat_pulldown_machine:'לאט פולדאון',plyo_box:'קופסת קפיצה',hack_squat:'האק סקוואט',treadmill:'הליכון',leg_extension:'מכונת פשיטת ברכיים',standing_calf_raise_machine:'תאומים בעמידה',shoulder_press_machine:'מכונת לחיצת כתפיים',plate_loaded_lateral_raise_machine:'מכונת הרמות צד',sled:'מזחלת',ab_crunch_machine:'מכונת בטן',ab_wheel:'גלגל בטן',air_bike:'אופני אוויר',assisted_pullup_machine:'מתח בעזרה',back_extension_machine:'פשיטת גב',bicep_curl_machine:'מכונת ביצפס',bicycle:'אופניים',chest_fly_machine:'מכונת פרפר',chest_press_machine:'מכונת לחיצת חזה',climbing_rope:'חבל טיפוס',donkey_calf_raise_machine:'תאומים דונקי',elliptical:'אליפטיקל',glute_ham_developer:'GHD',hip_abduction_machine:'מכונת מפשקים',hip_adduction_machine:'מכונת מקרבים',hip_thrust_machine:"מכונת היפ ת'ראסט",jump_rope:'חבל קפיצה',medicine_ball:'כדור כוח',pec_deck:'פק-דק',plate_loaded_dip_machine:'מכונת דיפס (פלטות)',preacher_curl_machine:'מכונת פריצ׳ר',reverse_fly_machine:'מכונת ריברס פלאי',rower:'חתירה (ארגומטר)',sandbag:'שק חול',seated_calf_raise_machine:'תאומים בישיבה',seated_row_machine:'מכונת חתירה',shrug_machine:'מכונת שראגס',ski_erg:'סקי-ארג',slam_ball:'סלאם בול',stair_climber:'מדרגות',stationary_bike:'אופני כושר',trap_bar:'טראפ-בר',tricep_extension_machine:'מכונת טריצפס',wall_ball:'וול בול',wrist_roller:'גלגלת אמות'};
const EQ_FREE = new Set(['dumbbell','barbell','kettlebell','ez_bar','flat_bench','plates','trap_bar','medicine_ball','sandbag','slam_ball','wall_ball']);
const EQ_BODY = new Set(['none','pull_up_bar','dip_station','rings','suspension_trainer','loop_band','resistance_band','bosu_ball','stability_ball','plyo_box','ab_wheel','jump_rope','climbing_rope']);
const EQ_CARDIO = new Set(['treadmill','stationary_bike','bicycle','rower','elliptical','stair_climber','ski_erg','air_bike','sled','battle_rope']);
const eqKind = eq => eq==='cable' ? 'cable' : EQ_FREE.has(eq) ? 'free' : EQ_BODY.has(eq) ? 'body' : EQ_CARDIO.has(eq) ? 'cardio' : 'machine';
const EQKIND = {machine:'מכונות',free:'משקולות חופשיות',cable:'כבלים',body:'משקל גוף',cardio:'קרדיו'};

/* ---------- machine catalog (generic machine types -> dataset exercises) ---------- */
const MACHINES = [
 {id:'chest_press',he:'לחיצת חזה (מכונה)',en:'Chest Press',g:'chest',kind:'machine',ex:['chest-press-machine','cable-chest-press']},
 {id:'pec_deck',he:'פק-דק / פרפר',en:'Pec Deck / Chest Fly',g:'chest',kind:'machine',ex:['pec-deck','machine-chest-fly']},
 {id:'shoulder_press',he:'לחיצת כתפיים (מכונה)',en:'Shoulder Press',g:'shoulders',kind:'machine',ex:['machine-shoulder-press','single-arm-machine-shoulder-press']},
 {id:'lat_raise_m',he:'הרמות צד (מכונה)',en:'Lateral Raise Machine',g:'shoulders',kind:'machine',ex:['plate-loaded-lateral-raise','single-arm-plate-loaded-lateral-raise']},
 {id:'rear_delt',he:'ריברס פלאי / דלתא אחורית',en:'Rear Delt / Reverse Fly',g:'shoulders',kind:'machine',ex:['machine-reverse-fly','cable-reverse-fly']},
 {id:'lat_pulldown',he:'לאט פולדאון',en:'Lat Pulldown',g:'back',kind:'machine',ex:['lat-pulldown','close-grip-lat-pulldown','v-bar-lat-pulldown','reverse-grip-lat-pulldown','one-arm-lat-pulldown','straight-arm-pulldown']},
 {id:'seated_row',he:'חתירה בישיבה',en:'Seated Row',g:'back',kind:'machine',ex:['seated-cable-row','chest-supported-machine-row','wide-grip-seated-cable-row','one-arm-seated-cable-row']},
 {id:'assisted',he:'מתח/מקבילים בעזרה',en:'Assisted Pull-up / Dip',g:'back',kind:'machine',ex:['assisted-pull-ups','assisted-dips']},
 {id:'back_ext',he:'פשיטת גב (מכונה)',en:'Back Extension',g:'back',kind:'machine',ex:['machine-back-extension','back-extension']},
 {id:'leg_press',he:'לג פרס',en:'Leg Press',g:'legs',kind:'machine',ex:['leg-press','single-leg-press','wide-stance-leg-press','high-foot-leg-press','close-stance-leg-press','horizontal-leg-press']},
 {id:'hack_squat',he:'האק סקוואט',en:'Hack Squat',g:'legs',kind:'machine',ex:['hack-squat','hack-squat-calf-raise']},
 {id:'leg_ext',he:'פשיטת ברכיים',en:'Leg Extension',g:'legs',kind:'machine',ex:['leg-extension','single-leg-extension']},
 {id:'leg_curl',he:'כפיפת ברכיים',en:'Leg Curl',g:'legs',kind:'machine',ex:['leg-curl','seated-leg-curl','single-leg-lying-leg-curl']},
 {id:'abductor',he:'מפשקים',en:'Hip Abduction',g:'glutes',kind:'machine',ex:['hip-abduction']},
 {id:'adductor',he:'מקרבים',en:'Hip Adduction',g:'legs',kind:'machine',ex:['hip-adduction']},
 {id:'glute_drive',he:"היפ ת'ראסט (מכונה)",en:'Glute Drive',g:'glutes',kind:'machine',ex:['plate-loaded-glute-drive','hip-thrust']},
 {id:'calf_stand',he:'תאומים בעמידה',en:'Standing Calf Raise',g:'legs',kind:'machine',ex:['machine-calf-raise','standing-calf-raise']},
 {id:'calf_seat',he:'תאומים בישיבה',en:'Seated Calf Raise',g:'legs',kind:'machine',ex:['seated-calf-raise']},
 {id:'ab_crunch',he:'כפיפות בטן (מכונה)',en:'Ab Crunch Machine',g:'core',kind:'machine',ex:['machine-seated-crunch','cable-crunch']},
 {id:'bicep_m',he:'ביצפס (מכונה)',en:'Biceps Curl Machine',g:'arms',kind:'machine',ex:['machine-bicep-curl','machine-preacher-curl']},
 {id:'tricep_m',he:'טריצפס (מכונה)',en:'Triceps Machine',g:'arms',kind:'machine',ex:['machine-triceps-extension','seated-dip-machine','plate-loaded-seated-dip-machine']},
 {id:'shrug_m',he:'שראגס (מכונה)',en:'Shrug Machine',g:'back',kind:'machine',ex:['plate-loaded-shrug','shrug']},
 {id:'smith',he:"מכונת סמית'",en:'Smith Machine',g:'full',kind:'machine',ex:['smith-machine-bench-press','smith-machine-incline-bench-press','smith-machine-shoulder-press','smith-machine-bent-over-row','smith-machine-hip-thrust','smith-machine-calf-raise','smith-machine-rdl','smith-machine-front-squat','smith-machine-reverse-lunge','smith-machine-shrug']},
 {id:'cable',he:'עמדת כבלים / קרוס-אובר',en:'Cable Station',g:'full',kind:'cable',ex:['cable-fly','cable-crunch','cable-lateral-raise','face-pull','tricep-pushdown','v-bar-tricep-pushdown','cable-curl','cable-hammer-curl','cable-bent-over-row','cable-kickback','cable-overhead-tricep-extension','cable-pallof-press','cable-front-raise','cable-upright-row','straight-arm-pulldown','kneeling-cable-row']},
 {id:'dip_bar',he:'מקבילים ומתח',en:'Dip Station & Pull-up Bar',g:'full',kind:'body',ex:['dips','weighted-dips','pull-up','chin-ups','neutral-grip-pull-ups','wide-grip-pull-ups','hanging-leg-raise','hanging-knee-raise']},
 {id:'rack',he:'ראק + מוט אולימפי',en:'Power Rack & Barbell',g:'full',kind:'free',ex:['bench-press','incline-bench-press','close-grip-bench-press','deadlift','romanian-deadlift','barbell-row','pendlay-row','seated-barbell-overhead-press','barbell-curl','ez-bar-curl','skull-crusher','good-morning','barbell-glute-bridge','barbell-calf-raise','upright-row','t-bar-row','landmine-press']},
 {id:'dumbbells',he:'משקולות יד',en:'Dumbbells',g:'full',kind:'free',ex:['db-bench-press','incline-db-press','db-fly','dumbbell-shoulder-press','lateral-raise','dumbbell-front-raise','rear-delt-fly','single-arm-db-row','chest-supported-db-row','seated-dumbbell-curl','hammer-curl','incline-db-curl','db-skull-crusher','overhead-tricep-extension','goblet-squat','db-goblet-squat','bulgarian-split-squat','lunge','dumbbell-deadlift','dumbbell-hip-thrust','db-shrug','dumbbell-calf-raise','dumbbell-farmers-walk']},
 {id:'kettlebells',he:'קטלבלים',en:'Kettlebells',g:'full',kind:'free',ex:['kettlebell-swing','one-arm-kettlebell-swing','kettlebell-goblet-lunge','one-arm-kettlebell-shoulder-press','double-kettlebell-overhead-press','kettlebell-hip-thrust','kettlebell-farmers-walk','kettlebell-shrug']},
 {id:'treadmill',he:'הליכון',en:'Treadmill',g:'cardio',kind:'cardio',ex:['treadmill-running','incline-treadmill-walk']},
 {id:'bike',he:'אופני כושר',en:'Bike',g:'cardio',kind:'cardio',ex:['stationary-bike','air-bike']},
 {id:'rower',he:'מכשיר חתירה',en:'Rower',g:'cardio',kind:'cardio',ex:['rowing-machine']},
 {id:'elliptical',he:'אליפטיקל',en:'Elliptical',g:'cardio',kind:'cardio',ex:['elliptical-trainer']},
 {id:'stairs',he:'מדרגות',en:'Stair Climber',g:'cardio',kind:'cardio',ex:['stair-climber']},
 {id:'skierg',he:'סקי-ארג',en:'Ski Erg',g:'cardio',kind:'cardio',ex:['ski-erg']},
];
const SELECTORIZED = MACHINES.filter(m=>m.kind==='machine' && m.id!=='smith').map(m=>m.id);
const FREE_AREA = ['smith','cable','dip_bar','rack','dumbbells','kettlebells'];
const CARDIO = ['treadmill','bike','rower','elliptical','stairs','skierg'];
const ALL_M = MACHINES.map(m=>m.id);

/* ---------- brands marketed in Israel (lines + distributor notes) ---------- */
const BRANDS = [
 {id:'technogym',name:'Technogym',he:'טכנוג׳ים',country:'איטליה',lines:'Selection 700/900 · Pure Strength · Artis · Biostrength',il:'יבואן רשמי: אג׳נטק (Agentek 1987), יקום · agentek.co.il',url:'https://www.technogym.com/int/products/strength/',m:ALL_M},
 {id:'lifefitness',name:'Life Fitness',he:'לייף פיטנס',country:'ארה״ב',lines:'Signature Series · Insignia · Optima · Axiom',il:'יבואן רשמי: אנרג׳ים (Energym) מאז 2013 · energym.co.il',url:'https://www.lifefitness.com/en-us/catalog/strength-training',m:ALL_M},
 {id:'hammer',name:'Hammer Strength',he:'האמר סטרנגת׳',country:'ארה״ב (קבוצת Life Fitness)',lines:'Plate-Loaded · Select · HD Elite',il:'יבואן רשמי: אנרג׳ים (Energym), יחד עם Life Fitness',url:'https://www.lifefitness.com/en-us/brands/hammer-strength',m:[...SELECTORIZED,'rack','dumbbells','dip_bar']},
 {id:'matrix',name:'Matrix Fitness',he:'מטריקס',country:'טייוואן / ארה״ב (Johnson Health Tech)',lines:'Ultra · Aura · Versa · Magnum',il:'יבואן בישראל לא אומת',url:'https://www.matrixfitness.com/us/eng/strength',m:ALL_M},
 {id:'cybex',name:'Cybex',he:'סייבקס',country:'ארה״ב (קבוצת Life Fitness)',lines:'Eagle NX · Prestige VRS · Ion · Bravo',il:'קבוצת Life Fitness · יבואן בישראל לא אומת',url:'https://www.cybexintl.com/strength',m:[...SELECTORIZED,'cable','rack','dumbbells']},
 {id:'precor',name:'Precor',he:'פריקור',country:'ארה״ב',lines:'Vitality · Resolute · Discovery',il:'יבואן בישראל לא אומת',url:'https://www.precor.com/en-us/commercial/strength',m:ALL_M},
 {id:'panatta',name:'Panatta',he:'פנאטה',country:'איטליה',lines:'Sec · Freeweight HP · XP Lux · Monolith',il:'יבואן בישראל לא אומת',url:'https://www.panattasport.com/en/',m:[...SELECTORIZED,'smith','cable','rack','dumbbells','dip_bar']},
 {id:'hoist',name:'Hoist',he:'הויסט',country:'ארה״ב',lines:'Roc-It · HD Dual · Motion Cage',il:'יבואן בישראל לא אומת',url:'https://www.hoistfitness.com/commercial',m:ALL_M},
 {id:'nautilus',name:'Nautilus',he:'נאוטילוס',country:'ארה״ב (Core Health & Fitness)',lines:'Inspiration · Leverage · Impact',il:'יבואן: אביר ספורט (Abir Sport), תל אביב · abirsport.co.il',url:'https://www.corehandf.com/brand/nautilus/',m:[...SELECTORIZED,'cable','rack','dumbbells']},
 {id:'startrac',name:'Star Trac',he:'סטאר טראק',country:'ארה״ב (Core Health & Fitness)',lines:'Impact Strength · Instinct',il:'יבואן בישראל לא אומת',url:'https://www.corehandf.com/brand/star-trac/',m:ALL_M},
 {id:'gym80',name:'gym80',he:'ג׳ים 80',country:'גרמניה',lines:'Sygnum · Pure Kraft · Outer Limits',il:'יבואן בישראל לא אומת',url:'https://www.gym80.de/en/',m:[...SELECTORIZED,'smith','cable','rack','dumbbells']},
 {id:'impulse',name:'Impulse',he:'אימפולס',country:'סין',lines:'IT95 · Encore ES · Sterling',il:'יבואן: אנרג׳ים (Energym)',url:'https://www.impulsefitness.com/',m:ALL_M},
 {id:'dhz',name:'DHZ Fitness',he:'DHZ',country:'סין',lines:'Fusion Pro · Evost · Prestige Pro',il:'יבואן בישראל לא אומת',url:'https://www.dhz-fitness.com/',m:ALL_M},
 {id:'bh',name:'BH Fitness',he:'BH',country:'ספרד',lines:'Inertia · TR Series · Movemia',il:'יבואן בישראל לא אומת',url:'https://www.bhfitness.com/',m:ALL_M},
 {id:'keiser',name:'Keiser',he:'קייזר',country:'ארה״ב',lines:'Air 300 · Air 350 · Functional Trainer',il:'יבואן בישראל לא אומת',url:'https://www.keiser.com/strength',m:[...SELECTORIZED.filter(x=>!['hack_squat','calf_seat','shrug_m'].includes(x)),'cable','bike']},
 {id:'eleiko',name:'Eleiko',he:'אלייקו',country:'שוודיה',lines:'Prestera Racks · IWF Bars · XF',il:'יבואן בישראל לא אומת',url:'https://www.eleiko.com/en/strength-equipment',m:['rack','dumbbells','kettlebells','dip_bar']},
 {id:'rogue',name:'Rogue Fitness',he:'רוג',country:'ארה״ב',lines:'Monster · Monster Lite · Infinity · Echo',il:'ייבוא עצמאי · יבואן רשמי לא אומת',url:'https://www.roguefitness.com/',m:['rack','dumbbells','kettlebells','dip_bar','bike','rower','skierg']},
 {id:'concept2',name:'Concept2',he:'קונספט 2',country:'ארה״ב',lines:'RowErg · SkiErg · BikeErg',il:'יבואן: אביר ספורט (Abir Sport) וקמעונאים',url:'https://www.concept2.com/',m:['rower','skierg','bike']},
 {id:'sportsart',name:'SportsArt',he:'ספורטסארט',country:'טייוואן / ארה״ב',lines:'Performance · Status · ECO-POWR',il:'יבואן: אביר ספורט (Abir Sport)',url:'https://www.gosportsart.com/strength/',m:ALL_M},
 {id:'truefitness',name:'True Fitness',he:'טרו',country:'ארה״ב',lines:'Force · Fuse · Palladium',il:'יבואן: אביר ספורט (Abir Sport)',url:'https://truefitness.com/commercial/strength/',m:ALL_M},
 {id:'freemotion',name:'Freemotion',he:'פרימושן',country:'ארה״ב (iFIT)',lines:'Genesis · Epic · Fusion',il:'יבואן: אביר ספורט (Abir Sport)',url:'https://www.freemotionfitness.com/',m:[...SELECTORIZED,'cable','rack','dumbbells']},
 {id:'realleader',name:'RealLeader',he:'ריל לידר',country:'סין',lines:'Selectorized · Plate Loaded',il:'יבואן: אביר ספורט (Abir Sport)',url:'https://www.realleaderusa.com/',m:ALL_M},
 {id:'other',name:'אחר / לא יודע',he:'',country:'',lines:'סט מכונות סטנדרטי',il:'',url:'',m:ALL_M},
];

