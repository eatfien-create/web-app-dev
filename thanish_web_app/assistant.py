"""Support assistant: answers from FAQ rows, explains error codes, else escalates."""
import re

from .models import FAQ, ErrorCode

STOP = set('the a an is are to of in on for and or how do i my what can me it with this that you your does'.split())
CODE_RE = re.compile(r'\b(?:VIV-\d{3}|[1-5]\d{2})\b', re.I)


def _tokens(text):
    return {w for w in re.findall(r'[a-z0-9]+', text.lower()) if w not in STOP and len(w) > 1}


def _score(query_tokens, faq):
    hay = _tokens(f'{faq.question} {faq.keywords}')
    body = _tokens(faq.answer)
    return 2 * len(query_tokens & hay) + 0.5 * len(query_tokens & body)


def answer(message):
    """Return dict(kind, reply, suggestions) where kind is faq|error|none."""
    codes = CODE_RE.findall(message)
    if codes:
        found = ErrorCode.objects.filter(code__in=[c.upper() for c in codes])
        if found:
            reply = '\n\n'.join(f'**{e.code} · {e.title}**\n{e.meaning}\nFix: {e.fix}' for e in found)
            return {'kind': 'error', 'reply': reply}

    q = _tokens(message)
    if q:
        ranked = sorted(((_score(q, f), f) for f in FAQ.objects.all()), key=lambda t: -t[0])
        best_score, best = ranked[0] if ranked else (0, None)
        covered = len(q & (_tokens(f'{best.question} {best.keywords}') | _tokens(best.answer))) / len(q) if best else 0
        if best and best_score >= 2 and covered >= 0.5:
            more = [f.question for s, f in ranked[1:3] if s >= 2]
            return {'kind': 'faq', 'reply': best.answer, 'matched': best.question, 'suggestions': more}

    return {
        'kind': 'none',
        'reply': "I couldn't find that in our FAQ. I can open a support ticket so a person can follow up.",
    }
