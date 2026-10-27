import { FormEvent, useEffect, useRef, useState } from 'react';

interface Msg {
  from: 'bot' | 'me';
  text: string;
  kind?: string;
  asked?: string;
  rated?: 'up' | 'down';
  suggestions?: string[];
}

const session = (() => {
  try {
    let s = localStorage.getItem('viv-session');
    if (!s) { s = crypto.randomUUID(); localStorage.setItem('viv-session', s); }
    return s;
  } catch { return 'anon'; }
})();

const post = (url: string, body: unknown) =>
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

const render = (t: string) => t.split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : p));

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{ from: 'bot', text: 'Hi, I\'m the Vivaria assistant. Ask about VPD, schedules, species, or paste an error code like 429.' }]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [ticketFor, setTicketFor] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { end.current?.scrollIntoView?.({ block: 'end' }); }, [msgs, open, ticketFor]);

  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    setMsgs((m) => [...m, { from: 'me', text }]);
    setInput(''); setBusy(true);
    try {
      const r = await post('/api/chat/', { message: text, session });
      const d = await r.json();
      if (!r.ok) setMsgs((m) => [...m, { from: 'bot', text: `${d.error.message} (error ${d.error.code})` }]);
      else {
        setMsgs((m) => [...m, { from: 'bot', text: d.reply, kind: d.kind, asked: text, suggestions: d.suggestions }]);
        if (d.kind === 'none') setTicketFor(text);
      }
    } catch {
      setMsgs((m) => [...m, { from: 'bot', text: 'I can\'t reach the server right now (503). Try again shortly.' }]);
    } finally { setBusy(false); }
  };

  // The custom 404/500 pages link here with ?ask=...
  useEffect(() => {
    const q = new URLSearchParams(location.search).get('ask');
    if (q) { setOpen(true); send(q); history.replaceState(null, '', location.pathname); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rate = (i: number, rating: 'up' | 'down') => {
    post('/api/feedback/', { session, rating, message: msgs[i].asked, comment: msgs[i].text.slice(0, 200) });
    setMsgs((m) => m.map((x, j) => (j === i ? { ...x, rated: rating } : x)));
  };

  const submitTicket = async (e: FormEvent) => {
    e.preventDefault();
    const r = await post('/api/ticket/', { message: ticketFor, email, source: 'assistant' });
    const d = await r.json();
    setTicketFor(null);
    setMsgs((m) => [...m, { from: 'bot', text: r.ok ? `Ticket #${d.ticket_id} created. A person will follow up${email ? ` at ${email}` : ''}.` : 'Could not create the ticket. Please try again.' }]);
  };

  return (
    <>
      <button className="chat-fab" onClick={() => setOpen(!open)} aria-label={open ? 'Close assistant' : 'Open assistant'}>{open ? '✕' : '🌿'}</button>
      {open && (
        <section className="chat glass" aria-label="Support assistant">
          <header><b>Vivaria Assistant</b><span className="muted small">FAQ · error codes · tickets</span></header>
          <div className="chat-body">
            {msgs.map((m, i) => (
              <div key={i} className={`bubble ${m.from}`}>
                <p>{render(m.text)}</p>
                {m.suggestions && m.suggestions.length > 0 && (
                  <div className="sugg">{m.suggestions.map((s) => <button key={s} onClick={() => send(s)}>{s}</button>)}</div>
                )}
                {m.from === 'bot' && m.asked && (
                  <div className="rate">
                    {m.rated ? <span className="muted small">Thanks for the feedback</span> : (<>
                      <button onClick={() => rate(i, 'up')} aria-label="Helpful">👍</button>
                      <button onClick={() => rate(i, 'down')} aria-label="Not helpful">👎</button>
                    </>)}
                  </div>
                )}
              </div>
            ))}
            {ticketFor && (
              <form className="ticket" onSubmit={submitTicket}>
                <label className="label">Email (optional)</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                <div><button className="btn" type="submit">Create support ticket</button> <button type="button" className="btn ghost" onClick={() => setTicketFor(null)}>No thanks</button></div>
              </form>
            )}
            {busy && <div className="bubble bot"><p className="muted">Thinking…</p></div>}
            <div ref={end} />
          </div>
          <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(input); }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question…" maxLength={500} aria-label="Message" />
            <button className="btn" type="submit" disabled={busy}>Send</button>
          </form>
        </section>
      )}
    </>
  );
}
