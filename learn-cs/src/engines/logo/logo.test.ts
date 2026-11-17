import { describe, expect, it } from 'vitest';
import { execLogo, parseLogo, sameDrawing } from './index';

describe('LOGO engine', () => {
  it('REPEAT 4 [FD 10 RT 90] draws a closed square and returns home facing up', () => {
    const r = execLogo('REPEAT 4 [ FD 10 RT 90 ]');
    expect(r.ok && r.state.segments.length).toBe(4);
    expect(r.ok && r.state.turtle).toMatchObject({ x: 0, y: 0, heading: 0 });
  });
  it('procedure with a parameter: SQUARE 20', () => {
    const r = execLogo('TO SQUARE :SIZE\n REPEAT 4 [ FD :SIZE RT 90 ]\nEND', 'SQUARE 20');
    expect(r.ok && r.state.segments.map((s) => Math.hypot(s.x2 - s.x1, s.y2 - s.y1))).toEqual([20, 20, 20, 20]);
  });
  it('POLYGONS :SIDES :SIZE uses 360 / :SIDES', () => {
    const r = execLogo('TO POLYGONS :SIDES :SIZE\n REPEAT :SIDES [ FD :SIZE RT 360 / :SIDES ]\nEND', 'POLYGONS 6 30');
    expect(r.ok && r.state.segments.length).toBe(6);
    expect(r.ok && r.state.turtle).toMatchObject({ x: 0, y: 0, heading: 0 });
  });
  const TOOTH = 'TO TOOTH :SIZE\n FD :SIZE\n LT 90\n FD :SIZE\n LT 90\n FD :SIZE\n RT 90\n FD :SIZE\n RT 90\nEND';
  const TEETH = 'TO TEETH :TIMES :SIZE\n REPEAT :TIMES [\n  TOOTH :SIZE\n ]\nEND';
  it('TEETH 3 20 (photo 76) draws 3 teeth = 12 segments, heading back to 0', () => {
    const r = execLogo(`${TOOTH}\n${TEETH}`, 'TEETH 3 20');
    expect(r.ok && r.state.segments.length).toBe(12);
    expect(r.ok && r.state.turtle.heading).toBe(0);
  });
  it('renamed parameter (:MOO) draws the same picture — the name does not matter', () => {
    const a = execLogo(`${TOOTH}\n${TEETH}`, 'TEETH 3 20');
    const b = execLogo(`${TOOTH.replace(/:SIZE/g, ':MOO')}\n${TEETH}`, 'TEETH 3 20');
    expect(a.ok && b.ok && sameDrawing(a.state.segments, b.state.segments)).toBe(true);
  });
  it('case 4 (photo 73): TOOTH without a parameter finds :SIZE in TEETH’s frame (dynamic scope)', () => {
    const tooth4 = TOOTH.replace('TO TOOTH :SIZE', 'TO TOOTH');
    const teeth4 = TEETH.replace('TOOTH :SIZE', 'TOOTH');
    const r = execLogo(`${tooth4}\n${teeth4}`, 'TEETH 3 20');
    expect(r.ok && r.stoppedBy).toBe('done');
    expect(r.ok && r.state.segments.length).toBe(12);
  });
  it('a variable that exists in no frame is a runtime error', () => {
    const r = execLogo('TO A\n FD :X\nEND', 'A');
    expect(r.ok && r.stoppedBy).toBe('error');
  });
  it('PU moves without drawing', () => {
    const r = execLogo('PU FD 50 PD FD 10');
    expect(r.ok && r.state.segments).toHaveLength(1);
    expect(r.ok && r.state.turtle.y).toBe(60);
  });
  it('syntax errors are reported with Hebrew messages', () => {
    expect(parseLogo('REPEAT 4 FD 10').errors[0].message).toContain('[');
    expect(parseLogo('FOO 3').errors[0].message).toContain('FOO');
    expect(parseLogo('TO SQ\n FD 10').errors[0].message).toContain('END');
  });
  it('the task sheet algorithm (photo 54) runs', () => {
    const r = execLogo('REPEAT 4 [ FD 100 RT 90 ]\nPU LT 90 FD 50 RT 90 PD\nREPEAT 4 [ REPEAT 3 [ FD 100 LT 120 ] PU FD 150 RT 90 FD 50 PD ]');
    expect(r.ok && r.stoppedBy).toBe('done');
  });
});
