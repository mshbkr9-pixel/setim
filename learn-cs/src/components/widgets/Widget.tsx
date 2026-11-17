'use client';
import type { Widget as W } from '@/content/types';
import { AlgolemLab } from '@/components/algolem/AlgolemLab';
import { LogoLab, StackView } from '@/components/logo/LogoLab';
import { SetsLab } from './SetsLab';
import { ArrowsLab, GraphLab } from './FunctionsLab';
import { Chain, CountersStatic, ErrorTree, LabelTable, MeaningGrid, PhotoFigure, QueenGame, TraceWidget } from './Diagrams';
import { Rich } from '@/components/ui/Rich';

/** Renders any interactive widget described in the content files. */
export function Widget({ w }: { w: W }) {
  const body = (() => {
    switch (w.kind) {
      case 'algolem':
        return <AlgolemLab code={w.code} inputs={w.inputs} procedures={w.procedures} editable={w.editable} panels={w.panels} helperMode={w.helperMode} goal={w.goal} tutor={w.tutor} />;
      case 'logo':
        return <LogoLab code={w.code} run={w.run} editable={w.editable} showStack={w.showStack} goal={w.goal} />;
      case 'counters':
        return <CountersStatic counters={w.counters} />;
      case 'trace':
        return <TraceWidget code={w.code} inputs={w.inputs} procedures={w.procedures} mode={w.mode} quiz={w.quiz} />;
      case 'venn':
        return <SetsLab universe={w.universe} sets={w.sets} show={w.show} draggable={w.draggable ?? true} />;
      case 'arrows':
        return <ArrowsLab domain={w.domain} codomain={w.codomain} arrows={w.arrows} editable={w.editable ?? true} />;
      case 'graph':
        return <GraphLab rules={w.rules} domain={w.domain} />;
      case 'meaning-grid':
        return <MeaningGrid code={w.code} procedures={w.procedures} vars={w.vars} max={w.max} />;
      case 'error-tree':
        return <ErrorTree highlight={w.highlight} />;
      case 'queen-game':
        return <QueenGame />;
      case 'chain':
        return <Chain steps={w.steps} arrows={w.arrows} />;
      case 'label-table':
        return <LabelTable code={w.code} labels={w.labels} />;
      case 'stack':
        return (
          <div className="card flex justify-center p-4">
            <StackView frames={w.frames.map((f) => ({ proc: f.proc, vars: f.vars }))} />
          </div>
        );
      case 'photo':
        return <PhotoFigure photo={w.photo} />;
    }
  })();
  return (
    <figure className="space-y-1.5">
      {body}
      {'caption' in w && w.caption && (
        <figcaption className="px-1 text-sm text-ink-2">
          <Rich text={w.caption} />
        </figcaption>
      )}
    </figure>
  );
}
