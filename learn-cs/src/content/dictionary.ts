/**
 * The course dictionary of Algolem words ("ביטוי / תחביר / פירוש"), copied from the table the course uses.
 * Rows keep the table's order (alphabetical). `red` = the word is written in red in that table.
 * Only the rows that were visible in the copy we received are included.
 */
export interface DictionaryEntry {
  /** The word as written in the table ("WHILE-ENDW"). */
  word: string;
  /** תחביר — empty when the table leaves it empty. */
  syntax: string;
  /** פירוש — one item per statement, exactly as in the table. */
  meaning: string[];
  kind: 'basic' | 'control' | 'word';
  red?: boolean;
  /** Name of the runnable procedure in the simulator's library (words only). */
  library?: string;
  /** Initial counter values for the "run it" example. */
  example: { code: string; inputs: Record<string, number> };
}

export const DICTIONARY: DictionaryEntry[] = [
  { word: 'ADD', syntax: 'ADD(A)', meaning: ['A = A+1'], kind: 'basic', example: { code: 'ADD (A)', inputs: { A: 3 } } },
  { word: 'EXCH', syntax: 'EXCH(A,B)', meaning: ['A = B', 'B = A'], kind: 'word', library: 'EXCH', example: { code: 'EXCH (A,B)', inputs: { A: 2, B: 7 } } },
  { word: 'FIVE', syntax: 'FIVE(A)', meaning: ['A = 5'], kind: 'word', library: 'FIVE', example: { code: 'FIVE (A)', inputs: { A: 9 } } },
  { word: 'HUN', syntax: 'HUN(A)', meaning: ['A = 100'], kind: 'word', library: 'HUN', example: { code: 'HUN (A)', inputs: { A: 0 } } },
  { word: 'MOVE', syntax: 'MOVE(A,B)', meaning: ['B = A', 'A = A'], kind: 'word', library: 'MOVE', example: { code: 'MOVE (A,B)', inputs: { A: 4, B: 9 } } },
  { word: 'MUL', syntax: 'MUL(A,B,C)', meaning: ['C = A*B'], kind: 'word', red: true, library: 'MUL', example: { code: 'MUL (A,B,C)', inputs: { A: 3, B: 4, C: 0 } } },
  { word: 'ONE', syntax: 'ONE(A)', meaning: ['A = 1'], kind: 'word', library: 'ONE', example: { code: 'ONE (A)', inputs: { A: 6 } } },
  { word: 'POW', syntax: 'POW(A,B,C)', meaning: ['C = A^B'], kind: 'word', red: true, library: 'POW', example: { code: 'POW (A,B,C)', inputs: { A: 2, B: 3, C: 0 } } },
  { word: 'SUB', syntax: 'SUB(A)', meaning: ['A = A–1'], kind: 'basic', example: { code: 'SUB (A)', inputs: { A: 3 } } },
  { word: 'SUCC', syntax: 'SUCC(A,B)', meaning: ['B = A+1'], kind: 'word', red: true, library: 'SUCC', example: { code: 'SUCC (A,B)', inputs: { A: 4, B: 0 } } },
  { word: 'SUM', syntax: 'SUM(A,B,C)', meaning: ['C = A+B'], kind: 'word', red: true, library: 'SUM', example: { code: 'SUM (A,B,C)', inputs: { A: 3, B: 4, C: 0 } } },
  { word: 'TEN', syntax: 'TEN(A)', meaning: ['A = 10'], kind: 'word', library: 'TEN', example: { code: 'TEN (A)', inputs: { A: 2 } } },
  { word: 'TWO', syntax: 'TWO(A)', meaning: ['A = 2'], kind: 'word', library: 'TWO', example: { code: 'TWO (A)', inputs: { A: 5 } } },
  {
    word: 'WHILE-ENDW',
    syntax: '',
    meaning: ['הוראת בקרה: לולאה'],
    kind: 'control',
    example: { code: 'WHILE (A)\n   ADD (B)\n   SUB (A)\nENDW', inputs: { A: 3, B: 1 } },
  },
  { word: 'ZERO', syntax: 'ZERO(A)', meaning: ['A = 0'], kind: 'word', library: 'ZERO', example: { code: 'ZERO (A)', inputs: { A: 4 } } },
];

export const KIND_LABEL: Record<DictionaryEntry['kind'], string> = {
  basic: 'הוראת יסוד',
  control: 'הוראת בקרה',
  word: 'מילה מוגדרת',
};
