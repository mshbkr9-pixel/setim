import { KEYWORDS, parseUnit } from './parse';
import { LIBRARY } from './library';
import type {
  AlgolemSyntaxError,
  CompileResult,
  CompiledUnit,
  HelperMode,
  Instr,
  ProgramSource,
  Stmt,
  Unit,
} from './types';

function lowerUnit(unit: Unit, id: string, origin: CompiledUnit['origin']): CompiledUnit {
  const code: Instr[] = [];
  const params = unit.params.map((p) => p.name);
  const free: string[] = [];
  const use = (n: string) => {
    if (!params.includes(n) && !free.includes(n)) free.push(n);
  };
  const emit = (stmts: Stmt[]) => {
    for (const s of stmts) {
      if (s.type === 'add' || s.type === 'sub') {
        use(s.arg.name);
        code.push({ op: s.type, arg: s.arg.name, line: s.line });
      } else if (s.type === 'while') {
        use(s.arg.name);
        const head = code.length;
        code.push({ op: 'while', arg: s.arg.name, exit: -1, line: s.line, endLine: s.endLine });
        emit(s.body);
        const endIdx = code.length;
        code.push({ op: 'endw', head, line: s.endLine, whileLine: s.line });
        code[head] = { op: 'while', arg: s.arg.name, exit: endIdx + 1, line: s.line, endLine: s.endLine };
      } else {
        s.args.forEach((a) => use(a.name));
        code.push({ op: 'call', proc: s.name, args: s.args.map((a) => a.name), line: s.line });
      }
    }
  };
  emit(unit.body);
  code.push({ op: 'end', line: unit.lineCount });
  return { id, name: unit.name, params, code, freeCounters: free, source: unit.source, lineCount: unit.lineCount, origin };
}

function collectCalls(stmts: Stmt[], out: { name: string; argc: number; line: number; col: number }[] = []) {
  for (const s of stmts) {
    if (s.type === 'call') out.push({ name: s.name, argc: s.args.length, line: s.line, col: s.col });
    else if (s.type === 'while') collectCalls(s.body, out);
  }
  return out;
}

/**
 * Compiles a program: the main algorithm, the learner's procedures and (optionally) the course library.
 * All checks of form (תחביר) happen here, before anything runs.
 */
export function compile(src: ProgramSource): CompileResult {
  const errors: AlgolemSyntaxError[] = [];
  const helperMode: HelperMode = src.helperMode ?? 'local';

  // ---- dictionary: library first, then learner procedures
  const units = new Map<string, { unit: Unit; origin: CompiledUnit['origin'] }>();
  const wanted = src.library ?? 'all';
  const libSelection = wanted === 'all' ? LIBRARY : wanted === 'none' ? [] : LIBRARY.filter((p) => wanted.includes(p.name));
  for (const lp of libSelection) {
    const r = parseUnit(lp.source, lp.name);
    if (r.unit) units.set(lp.name, { unit: r.unit, origin: 'library' });
  }
  for (const text of src.procedures ?? []) {
    if (!text.trim()) continue;
    const r = parseUnit(text, null);
    if (!r.unit) {
      errors.push(...r.errors.map((e) => ({ ...e, unit: e.unit ?? '?' })));
      continue;
    }
    if (!r.unit.name) {
      errors.push({
        kind: 'syntax',
        code: 'header-missing',
        unit: '?',
        line: 1,
        col: 1,
        message: 'הגדרת פרוצדורה חייבת להתחיל בכותרת: @ NAME (A)',
        hint: 'הסימן @ מציין הגדרת מילה חדשה; אחריו השם והמשתנים בסוגריים, מופרדים בפסיקים.',
      });
      continue;
    }
    const prev = units.get(r.unit.name);
    if (prev && prev.origin === 'user') {
      errors.push({
        kind: 'syntax',
        code: 'duplicate-procedure',
        unit: r.unit.name,
        line: r.unit.headerLine ?? 1,
        col: 1,
        message: `הפרוצדורה ${r.unit.name} מוגדרת פעמיים`,
      });
      continue;
    }
    // A learner definition replaces a library word with the same name.
    units.set(r.unit.name, { unit: r.unit, origin: 'user' });
  }

  // ---- main algorithm
  const mainParsed = parseUnit(src.main, null);
  if (!mainParsed.unit) return { ok: false, program: null, errors: [...errors, ...mainParsed.errors] };
  const mainUnit = mainParsed.unit;
  if (mainUnit.body.length === 0) {
    errors.push({ kind: 'syntax', code: 'empty-program', unit: mainUnit.name, line: 1, col: 1, message: 'אין הוראות לביצוע', hint: 'כתבו לפחות הוראה אחת, למשל ADD (A).' });
  }

  // ---- check calls (existence + arity) in main and in every reachable procedure
  const reachable = new Set<string>();
  const checkUnit = (unit: Unit, label: string | null) => {
    for (const c of collectCalls(unit.body)) {
      if (KEYWORDS.has(c.name)) continue;
      const target = units.get(c.name);
      if (!target || (mainUnit.name && c.name === mainUnit.name && label === mainUnit.name && unit === mainUnit)) {
        if (mainUnit.name && c.name === mainUnit.name && unit === mainUnit) {
          errors.push({ kind: 'syntax', code: 'recursive-procedure', unit: label, line: c.line, col: c.col, message: `הפרוצדורה ${c.name} קוראת לעצמה`, hint: 'בשפת אלגולם של הקורס אין קריאה של פרוצדורה לעצמה.' });
          continue;
        }
        if (!target) {
          const names = [...units.keys()].join(', ');
          errors.push({
            kind: 'syntax',
            code: 'undefined-procedure',
            unit: label,
            line: c.line,
            col: c.col,
            message: `המילה ${c.name} אינה פקודה ואינה פרוצדורה מוגדרת`,
            hint: names ? `פרוצדורות זמינות: ${names}. פקודות היסוד: ADD, SUB, WHILE, ENDW.` : 'פקודות היסוד: ADD, SUB, WHILE, ENDW.',
          });
          continue;
        }
      }
      const params = target.unit.params.length;
      if (params !== c.argc) {
        errors.push({
          kind: 'syntax',
          code: 'wrong-arg-count',
          unit: label,
          line: c.line,
          col: c.col,
          message: `${c.name} מקבלת ${params} ${params === 1 ? 'מונה' : 'מונים'}, אבל נשלחו ${c.argc}`,
          hint: `ההגדרה: ${target.unit.source.split('\n')[0].trim()}`,
        });
      }
    }
  };

  // depth-first over the call graph, detecting cycles (recursion)
  const visiting = new Set<string>();
  const visit = (name: string, fromLabel: string | null, line: number) => {
    if (visiting.has(name)) {
      errors.push({ kind: 'syntax', code: 'recursive-procedure', unit: fromLabel, line, col: 1, message: `נוצרה קריאה מעגלית: ${[...visiting, name].join(' → ')}`, hint: 'בשפת אלגולם של הקורס פרוצדורה אינה קוראת לעצמה, גם לא דרך פרוצדורה אחרת.' });
      return;
    }
    if (reachable.has(name)) return;
    const entry = units.get(name);
    if (!entry) return;
    visiting.add(name);
    checkUnit(entry.unit, name);
    for (const c of collectCalls(entry.unit.body)) visit(c.name, name, c.line);
    visiting.delete(name);
    reachable.add(name);
  };

  checkUnit(mainUnit, mainUnit.name);
  if (mainUnit.name) visiting.add(mainUnit.name);
  for (const c of collectCalls(mainUnit.body)) visit(c.name, mainUnit.name, c.line);
  if (mainUnit.name) visiting.delete(mainUnit.name);

  // learner procedures that are not called still get checked, so mistakes show up early
  for (const [name, e] of units) if (e.origin === 'user' && !reachable.has(name)) visit(name, name, e.unit.headerLine ?? 1);

  if (errors.length) return { ok: false, program: null, errors: dedupe(errors) };

  const main = lowerUnit(mainUnit, 'main', 'main');
  const procs: Record<string, CompiledUnit> = {};
  for (const [name, e] of units) procs[name] = lowerUnit(e.unit, name, e.origin);

  const counters = [...main.params, ...main.freeCounters];
  const hidden: string[] = [];
  if (helperMode === 'shared') {
    const seen = new Set<string>();
    const walk = (u: CompiledUnit) => {
      for (const ins of u.code) {
        if (ins.op === 'call' && !seen.has(ins.proc)) {
          seen.add(ins.proc);
          const pu = procs[ins.proc];
          for (const f of pu.freeCounters) if (!counters.includes(f) && !hidden.includes(f)) hidden.push(f);
          walk(pu);
        }
      }
    };
    walk(main);
  }
  return { ok: true, program: { main, procs, helperMode, counters, hiddenCounters: hidden }, errors: [] };
}

function dedupe(errors: AlgolemSyntaxError[]): AlgolemSyntaxError[] {
  const seen = new Set<string>();
  return errors.filter((e) => {
    const k = `${e.unit}|${e.line}|${e.col}|${e.code}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
