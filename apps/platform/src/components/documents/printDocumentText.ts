/** Print only the selected record, never other participants on the staff queue. */
export function printDocumentText(text: string): void {
  const frame = document.createElement('iframe');
  frame.title = 'Printable document record';
  frame.style.position = 'fixed';
  frame.style.width = '1px';
  frame.style.height = '1px';
  frame.style.opacity = '0';
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  if (!doc || !win) {
    frame.remove();
    return;
  }
  const pre = doc.createElement('pre');
  pre.style.whiteSpace = 'pre-wrap';
  pre.style.overflowWrap = 'anywhere';
  pre.style.font = '12pt sans-serif';
  pre.textContent = text;
  doc.body.appendChild(pre);
  win.addEventListener('afterprint', () => frame.remove(), { once: true });
  win.focus();
  win.print();
}
