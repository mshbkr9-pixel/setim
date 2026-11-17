/** Plain explanation of one line of LOGO code (for "תסביר כל שורת קוד"). Deterministic. */
export function explainLogoLine(text: string): string {
  const t = text.replace(/;.*$/, '').trim();
  if (!t) return '';
  const up = t.toUpperCase();
  const parts: string[] = [];
  const re = /(REPEAT\s+\S+\s*\[|TO\s+\S+(\s+:\S+)*|END|\]|FD\s+\S+|FORWARD\s+\S+|BK\s+\S+|BACK\s+\S+|RT\s+\S+|RIGHT\s+\S+|LT\s+\S+|LEFT\s+\S+|PU|PENUP|PD|PENDOWN|HOME|CS)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(up))) {
    const tok = m[0];
    const arg = tok.split(/\s+/)[1];
    const val = arg?.startsWith(':') ? `הערך של המשתנה ${arg}` : arg;
    if (tok.startsWith('REPEAT')) parts.push(`חזור ${val} פעמים על מה שבסוגריים המרובעים`);
    else if (tok.startsWith('TO')) {
      const [, name, ...ps] = tok.split(/\s+/);
      parts.push(`תחילת הגדרה של פרוצדורה חדשה בשם ${name}${ps.length ? ` עם ${ps.length === 1 ? 'משתנה' : 'משתנים'} ${ps.join(' ')}` : ''} (עוד לא מצייר — רק שומר)`);
    } else if (tok === 'END') parts.push('סוף הגדרת הפרוצדורה');
    else if (tok === ']') parts.push('סוף גוף הלולאה');
    else if (/^(FD|FORWARD)/.test(tok)) parts.push(`התקדם קדימה ${val} צעדים`);
    else if (/^(BK|BACK)/.test(tok)) parts.push(`זוז אחורה ${val} צעדים`);
    else if (/^(RT|RIGHT)/.test(tok)) parts.push(`פנה ימינה ${val} מעלות (בלי לזוז)`);
    else if (/^(LT|LEFT)/.test(tok)) parts.push(`פנה שמאלה ${val} מעלות (בלי לזוז)`);
    else if (/^(PU|PENUP)$/.test(tok)) parts.push('הרם את העט (מעכשיו בלי לצייר)');
    else if (/^(PD|PENDOWN)$/.test(tok)) parts.push('הורד את העט (מעכשיו מציירים)');
    else if (tok === 'HOME') parts.push('חזור לנקודת ההתחלה');
    else if (tok === 'CS') parts.push('נקה את המסך');
  }
  if (!parts.length) {
    const w = up.split(/\s+/);
    return `קריאה לפרוצדורה ${w[0]}${w.length > 1 ? ` עם הערכים ${w.slice(1).join(' ')}` : ''} — מבצעים את ההוראות שבהגדרה שלה`;
  }
  return parts.join('; ') + '.';
}
