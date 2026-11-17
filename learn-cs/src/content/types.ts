/**
 * Content schema of the course. Pure data: no React, no engine imports.
 *
 * RichText is a small Markdown subset rendered by <Rich/>:
 *   **bold**, `code` (always LTR), $math$ (KaTeX, LTR), line breaks, "- " bullet lines.
 */
export type RichText = string;

/**
 * Where a piece of content comes from — never mix them without saying so:
 *  - `source`      : the lecturer's original material (quoted or faithfully restated from a photo)
 *  - `explanation` : a new explanation written to clarify the material
 *  - `new`         : a new example or exercise written for practice
 */
export type Origin = 'source' | 'explanation' | 'new';

export type Confidence = 'high' | 'medium' | 'low';

/** Photo numbers 1–76 (PDF page = photo + 22). `guide` = pages 1–22 of the PDF (the NotebookLM study guide). */
export interface SourceRef {
  photos: number[];
  guidePages?: number[];
  note?: string;
}

export type TrackId = 'logo' | 'algolem' | 'trace' | 'errors' | 'sets' | 'functions';

export type CodeLang = 'algolem' | 'logo';

export interface GlossaryEntry {
  term: string;
  /** Explanation a 12-year-old understands. */
  simple: RichText;
  /** Optional precise / formal wording. */
  formal?: RichText;
  photos?: number[];
}

// ---------------------------------------------------------------- widgets (interactive visuals)

export interface AlgolemWidget {
  kind: 'algolem';
  code: string;
  inputs: Record<string, number>;
  /** Extra procedures written for this example (the course library is always available). */
  procedures?: string[];
  editable?: boolean;
  /** Which side panels to open initially. */
  panels?: ('trace' | 'frames' | 'modular' | 'lines')[];
  helperMode?: 'local' | 'shared';
  /** Start with the step tutor on ("what will happen to the counter after the next command?"). */
  tutor?: boolean;
  /** Optional target the learner must reach (checked by the engine). */
  goal?: { text: RichText; tests: AlgolemTest[] };
  caption?: RichText;
}

export interface AlgolemTest {
  inputs: Record<string, number>;
  /** Expected visible counter values, or 'no-output' (error / infinite). Unlisted counters are not checked. */
  expect: Record<string, number> | 'no-output';
}

export interface LogoWidget {
  kind: 'logo';
  /** Procedure definitions and/or commands. */
  code: string;
  /** Command typed in the Commander line, e.g. "TEETH 3 20". */
  run?: string;
  editable?: boolean;
  showStack?: boolean;
  goal?: { text: RichText; target: string };
  caption?: RichText;
}

export type Widget =
  | AlgolemWidget
  | LogoWidget
  | { kind: 'counters'; counters: { name: string; value: number }[]; caption?: RichText }
  | { kind: 'trace'; code: string; inputs: Record<string, number>; procedures?: string[]; mode: 'lines' | 'rounds' | 'modular'; quiz?: boolean; caption?: RichText }
  | {
      kind: 'venn';
      universe: (string | number)[];
      sets: Record<string, (string | number)[]>;
      /** Operation to highlight first. */
      show?: 'none' | 'difference' | 'intersection' | 'union' | 'subset' | 'equal';
      draggable?: boolean;
      caption?: RichText;
    }
  | {
      kind: 'arrows';
      domain: string[];
      codomain: string[];
      arrows: [string, string][];
      editable?: boolean;
      caption?: RichText;
    }
  | {
      kind: 'graph';
      rules: ('square' | 'identity')[];
      domain: 'R' | 'N' | number[];
      caption?: RichText;
    }
  | { kind: 'meaning-grid'; code: string; procedures?: string[]; vars: [string, string]; max: number; caption?: RichText }
  | { kind: 'error-tree'; highlight?: 'syntax' | 'semantic' | 'meaningless' | 'runtime' | 'infinite'; caption?: RichText }
  | { kind: 'queen-game'; caption?: RichText }
  | { kind: 'chain'; lang: CodeLang; steps: { code: string; caption?: string }[]; arrows: string[]; caption?: RichText }
  | {
      kind: 'label-table';
      lang: CodeLang;
      code: string;
      /** Label cells: lines `from`..`to` (1-based), `level` 1 = closest to the code. */
      labels: { from: number; to: number; text: string; level: number }[];
      caption?: RichText;
    }
  | { kind: 'stack'; frames: { proc: string; vars: { name: string; value: string }[] }[]; caption?: RichText }
  | { kind: 'photo'; photo: number; caption?: RichText };

// ---------------------------------------------------------------- questions

export interface QuestionBase {
  id: string;
  track: TrackId;
  /** Lesson this question belongs to (optional). */
  lesson?: string;
  /** Skill tags, used to detect repeated mistakes (see skills.ts). */
  skills: string[];
  difficulty: 1 | 2 | 3;
  origin: Origin;
  sources?: SourceRef;
  prompt: RichText;
  /** Code shown with the question (read-only). */
  code?: string;
  codeLang?: CodeLang;
  /** Hints, from gentle to specific. Never contain the answer itself. */
  hints: RichText[];
  /** Full explanation shown after a correct answer or after giving up. */
  explanation: RichText;
}

export interface Choice {
  text: RichText;
  correct?: boolean;
  /** Why this choice is wrong (shown instead of the answer). */
  feedback?: RichText;
  /** Misconception tag (see skills.ts) for the tutor. */
  misconception?: string;
}

export type Question = QuestionBase &
  (
    | { type: 'mcq'; choices: Choice[]; multi?: boolean }
    | {
        /** Predict the output of an Algolem program. The answer is computed by the engine. */
        type: 'predict';
        program: { code: string; procedures?: string[]; inputs: Record<string, number> };
        /** Counters to ask about. */
        ask: string[];
      }
    | {
        /** Fill the blank (___) in code. Correct if the completed program passes the tests (engine). */
        type: 'complete-code';
        lang: 'algolem';
        template: string;
        options: string[];
        tests: AlgolemTest[];
        procedures?: string[];
      }
    | { type: 'find-bug'; lang: CodeLang; listing: string; bugLines: number[] }
    | {
        /** Fill cells of a trace table. Values are computed by the engine. */
        type: 'trace-fill';
        program: { code: string; procedures?: string[]; inputs: Record<string, number> };
        mode: 'rounds' | 'lines';
        /** Which cells are blank: column index (0 = input) and counter. Omit = all non-input cells. */
        blanks?: { col: number; counter: string }[];
      }
    | { type: 'order'; items: RichText[] }
    | {
        /** Write an algorithm. Checked by running it on the tests. */
        type: 'build';
        lang: 'algolem';
        starter?: string;
        tests: AlgolemTest[];
        procedures?: string[];
        /** Restrict to these words (e.g. only ADD, SUB, WHILE, ENDW). */
        allowed?: string[];
        /** A correct solution (shown only after the learner gives up; used to validate the tests). */
        solution: string;
      }
    | {
        /** Reach a target state by pressing ADD/SUB buttons (no code). */
        type: 'sim-goal';
        start: Record<string, number>;
        target: Record<string, number>;
        maxMoves?: number;
      }
    | { type: 'match'; pairs: [RichText, RichText][] }
    | { type: 'numeric'; answer: number; unit?: string }
    | {
        /** Write the elements of a set expression, e.g. "A - B". Computed by the sets engine. */
        type: 'set-answer';
        sets: Record<string, (number | string)[]>;
        expr: string;
      }
    | {
        /** Classify an arrow diagram. Computed by the functions engine. */
        type: 'arrows-classify';
        domain: string[];
        codomain: string[];
        arrows: [string, string][];
        ask: ('function' | 'injective' | 'surjective')[];
      }
    | {
        /** Predict the turtle state after running LOGO code. Computed by the LOGO engine. */
        type: 'logo-state';
        code: string;
        run?: string;
        ask: ('x' | 'y' | 'heading' | 'pen' | 'lines')[];
      }
  );

export type QuestionType = Question['type'];

// ---------------------------------------------------------------- lessons

export interface WalkStep {
  text: RichText;
  /** Code shown in this step, with highlighted lines. */
  code?: string;
  lang?: CodeLang;
  highlight?: number[];
  /** Small state display: counter/variable values after this step. */
  state?: Record<string, number | string>;
}

export interface ExplanationLevels {
  /** Level 1 — beginner: everyday language. */
  beginner: RichText;
  /** Level 2 — regular: professional with examples. */
  regular: RichText;
  /** Level 3 — advanced: formal, exam-oriented methods. */
  advanced: RichText;
}

export interface Lesson {
  id: string;
  track: TrackId;
  /** Order inside the track (1-based). */
  order: number;
  title: string;
  /** Short subtitle for cards. */
  subtitle: string;
  minutes: number;
  difficulty: 1 | 2 | 3;
  prerequisites: string[];
  sources: SourceRef;
  confidence: Confidence;
  /** Skill tags this lesson teaches. */
  skills: string[];

  /** א. הקדמה פשוטה */
  intro: { what: RichText; why: RichText; goals: RichText[] };
  /** ב. מילון מושגים */
  glossary: GlossaryEntry[];
  /** ג. הסבר ויזואלי — three levels + the main visual */
  explain: ExplanationLevels;
  visual: Widget;
  /** Lecturer's original material quoted/restated in the lesson (shown with a "מקור" tag). */
  fromSource?: { text: RichText; photos: number[] }[];
  /** ד. הדגמה מפורקת — step by step */
  walkthrough: { title: RichText; origin: Origin; steps: WalkStep[] };
  /** ה. התנסות */
  tryIt: { task: RichText; widget: Widget };
  /** Extra examples for "תן לי דוגמה אחרת". */
  moreExamples?: { title: RichText; origin: Origin; widget?: Widget; text?: RichText }[];
  /** ו. שאלה אחת + ז. משוב (inside the question) */
  check: Question;
  /** ח. סיכום והמשך */
  summary: { learned: RichText[]; next: RichText };
}

export interface Track {
  id: TrackId;
  title: string;
  subtitle: string;
  /** Original unit codes in the course (e.g. "א.2"). */
  units: string[];
  color: string;
}
