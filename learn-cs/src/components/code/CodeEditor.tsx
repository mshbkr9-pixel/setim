'use client';
import { useEffect, useRef } from 'react';
import { EditorState, StateEffect, StateField, RangeSetBuilder, type Extension } from '@codemirror/state';
import { Decoration, EditorView, keymap, lineNumbers, type DecorationSet } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { HighlightStyle, StreamLanguage, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

type Lang = 'algolem' | 'logo';

const KW: Record<Lang, RegExp> = {
  algolem: /^(ADD|SUB|WHILE|ENDW)\b/i,
  logo: /^(FD|BK|RT|LT|PU|PD|FORWARD|BACK|RIGHT|LEFT|PENUP|PENDOWN|REPEAT|TO|END|HOME|CS|CLEARSCREEN|HT|ST)\b/i,
};

function language(lang: Lang) {
  return StreamLanguage.define<{ afterTo: boolean }>({
    startState: () => ({ afterTo: false }),
    token(stream, state) {
      if (stream.eatSpace()) return null;
      if (stream.match('//') || stream.match(';') || stream.match('#')) {
        stream.skipToEnd();
        return 'comment';
      }
      if (lang === 'algolem' && stream.sol() && stream.match(/^\d+\s*[.):]/)) return 'comment';
      if (stream.match('@')) {
        state.afterTo = true;
        return 'meta';
      }
      if (stream.match(KW[lang])) {
        if (/^to$/i.test(stream.current())) state.afterTo = true;
        return 'keyword';
      }
      if (lang === 'logo' && stream.match(/^:[A-Za-z0-9_.?]+/)) return 'variableName';
      if (stream.match(/^\d+(\.\d+)?/)) return 'number';
      if (stream.match(/^[A-Za-z][A-Za-z0-9_]*/)) {
        if (state.afterTo) {
          state.afterTo = false;
          return 'def';
        }
        return 'name';
      }
      if (stream.match(/^[()[\],]/)) return 'bracket';
      stream.next();
      return null;
    },
  });
}

const style = HighlightStyle.define([
  { tag: tags.keyword, color: 'var(--accent-strong)', fontWeight: '600' },
  { tag: tags.meta, color: 'var(--ball-dark)', fontWeight: '700' },
  { tag: tags.definition(tags.variableName), color: 'var(--ball-dark)', fontWeight: '600', textDecoration: 'underline' },
  { tag: tags.variableName, color: 'var(--info)' },
  { tag: tags.number, color: 'var(--t-sets)' },
  { tag: tags.comment, color: 'var(--ink-3)' },
  { tag: tags.name, color: 'var(--ink)' },
  { tag: tags.bracket, color: 'var(--ink-3)' },
]);

const setMarks = StateEffect.define<{ active: number[]; errors: number[] }>();
const marksField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    deco = deco.map(tr.changes);
    for (const e of tr.effects) {
      if (e.is(setMarks)) {
        const b = new RangeSetBuilder<Decoration>();
        const doc = tr.state.doc;
        const lines = [...new Set([...e.value.active, ...e.value.errors])].filter((n) => n >= 1 && n <= doc.lines).sort((a, b2) => a - b2);
        for (const n of lines) {
          const cls = e.value.errors.includes(n) ? 'cm-error-line' : 'cm-active-exec';
          b.add(doc.line(n).from, doc.line(n).from, Decoration.line({ class: cls }));
        }
        deco = b.finish();
      }
    }
    return deco;
  },
  provide: (f) => EditorView.decorations.from(f),
});

export interface CodeEditorProps {
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  lang?: Lang;
  activeLines?: number[];
  errorLines?: number[];
  minHeight?: number;
  ariaLabel?: string;
}

export function CodeEditor({ value, onChange, readOnly = false, lang = 'algolem', activeLines = [], errorLines = [], minHeight = 140, ariaLabel = 'עורך קוד' }: CodeEditorProps) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!host.current) return;
    const extensions: Extension[] = [
      lineNumbers(),
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
      language(lang),
      syntaxHighlighting(style),
      marksField,
      EditorView.lineWrapping,
      EditorState.readOnly.of(readOnly),
      EditorView.editable.of(!readOnly),
      EditorView.contentAttributes.of({ 'aria-label': ariaLabel, dir: 'ltr', spellcheck: 'false', autocapitalize: 'off', autocorrect: 'off' }),
      EditorView.theme({ '&': { minHeight: `${minHeight}px` }, '.cm-scroller': { minHeight: `${minHeight}px` } }),
      EditorView.updateListener.of((u) => {
        if (u.docChanged) onChangeRef.current?.(u.state.doc.toString());
      }),
    ];
    const v = new EditorView({ state: EditorState.create({ doc: value, extensions }), parent: host.current });
    view.current = v;
    return () => {
      v.destroy();
      view.current = null;
    };
    // the editor is created once per mount; value changes from outside are synced below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, readOnly]);

  useEffect(() => {
    const v = view.current;
    if (v && v.state.doc.toString() !== value) v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
  }, [value]);

  useEffect(() => {
    view.current?.dispatch({ effects: setMarks.of({ active: activeLines, errors: errorLines }) });
  }, [activeLines, errorLines]);

  return <div ref={host} dir="ltr" className="overflow-hidden rounded-[10px] border border-line" />;
}
