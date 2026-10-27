import json
import logging
import os
import time
from collections import defaultdict, deque

import requests
from django.db import connection
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from . import assistant, mongo
from .models import FAQ, ErrorCode, SupportTicket

logger = logging.getLogger(__name__)
STARTED = time.time()

_hits = defaultdict(deque)
RATE_LIMIT, RATE_WINDOW = 20, 60  # chat messages per IP per minute


def _ip(request):
    return request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', '-')).split(',')[0]


def _error(status, code, message):
    return JsonResponse({'error': {'code': code, 'message': message}}, status=status)


def _body(request):
    try:
        return json.loads(request.body or b'{}')
    except ValueError:
        return None


def spa(request, *args, **kwargs):
    return render(request, 'index.html')


@require_GET
def faqs(request):
    data = [{'id': f.id, 'category': f.category, 'question': f.question, 'answer': f.answer} for f in FAQ.objects.all()]
    return JsonResponse({'faqs': data})


@require_GET
def error_codes(request):
    data = list(ErrorCode.objects.values('code', 'title', 'meaning', 'fix'))
    return JsonResponse({'errors': data})


@csrf_exempt
@require_POST
def chat(request):
    ip = _ip(request)
    now = time.time()
    q = _hits[ip]
    while q and now - q[0] > RATE_WINDOW:
        q.popleft()
    if len(q) >= RATE_LIMIT:
        return _error(429, '429', 'Too many messages. Please wait a minute.')
    q.append(now)

    body = _body(request)
    message = (body or {}).get('message', '').strip() if body is not None else None
    if not message or len(message) > 500:
        return _error(400, '400', 'Send a "message" of 1-500 characters.')

    result = assistant.answer(message)
    mongo.save('chat_logs', {
        'session': (body.get('session') or '')[:64], 'ip': ip,
        'message': message, 'kind': result['kind'], 'reply': result['reply'],
    })
    return JsonResponse(result)


@csrf_exempt
@require_POST
def feedback(request):
    body = _body(request)
    if body is None or body.get('rating') not in ('up', 'down'):
        return _error(400, '400', 'rating must be "up" or "down".')
    mongo.save('feedback', {
        'session': str(body.get('session', ''))[:64], 'rating': body['rating'],
        'message': str(body.get('message', ''))[:500], 'comment': str(body.get('comment', ''))[:500],
    })
    return JsonResponse({'ok': True})


@csrf_exempt
@require_POST
def ticket(request):
    body = _body(request)
    if body is None or not str(body.get('message', '')).strip():
        return _error(400, '400', 'A ticket needs a message.')
    t = SupportTicket.objects.create(
        email=str(body.get('email', ''))[:254],
        subject=(str(body.get('subject') or body['message']))[:160],
        message=str(body['message'])[:2000],
        source=str(body.get('source', 'assistant'))[:20],
    )
    return JsonResponse({'ok': True, 'ticket_id': t.id}, status=201)


def _ticket_json(t):
    return {'id': t.id, 'email': t.email, 'subject': t.subject, 'message': t.message,
            'source': t.source, 'status': t.status, 'created_at': t.created_at.isoformat()}


@csrf_exempt
def ticket_detail(request, pk):
    """Read / update / delete a ticket. Staff only (log in via /admin/)."""
    if not request.user.is_staff:
        return _error(401, '401', 'Staff login required (sign in at /admin/).')
    try:
        t = SupportTicket.objects.get(pk=pk)
    except SupportTicket.DoesNotExist:
        return _error(404, '404', 'Ticket not found.')
    if request.method == 'GET':
        return JsonResponse(_ticket_json(t))
    if request.method == 'PATCH':
        body = _body(request) or {}
        if body.get('status') in ('open', 'closed'):
            t.status = body['status']
        if 'message' in body:
            t.message = str(body['message'])[:2000]
        t.save()
        return JsonResponse(_ticket_json(t))
    if request.method == 'DELETE':
        t.delete()
        return JsonResponse({'ok': True})
    return _error(400, '400', 'Use GET, PATCH or DELETE.')


@require_GET
def ticket_list(request):
    if not request.user.is_staff:
        return _error(401, '401', 'Staff login required (sign in at /admin/).')
    return JsonResponse({'tickets': [_ticket_json(t) for t in SupportTicket.objects.all()[:100]]})


@require_GET
def weather(request):
    """Outdoor conditions via Open-Meteo (no key). 3s limit, falls back to defaults."""
    lat, lon = request.GET.get('lat', '47.37'), request.GET.get('lon', '8.54')
    try:
        r = requests.get(
            'https://api.open-meteo.com/v1/forecast',
            params={'latitude': lat, 'longitude': lon, 'current': 'temperature_2m,relative_humidity_2m'},
            timeout=3,
        )
        r.raise_for_status()
        cur = r.json()['current']
        return JsonResponse({'temp_c': cur['temperature_2m'], 'rh': cur['relative_humidity_2m'], 'source': 'open-meteo'})
    except Exception as exc:
        logger.warning('weather fallback: %s', exc)
        return JsonResponse({'temp_c': 18.0, 'rh': 55, 'source': 'fallback'})


@require_GET
def health(request):
    checks = {}
    try:
        with connection.cursor() as c:
            c.execute('SELECT 1')
        checks['sql'] = 'ok'
    except Exception:
        checks['sql'] = 'down'
    if os.environ.get('MONGO_URI'):
        checks['mongodb'] = 'ok' if mongo.ping() else 'down'
    else:
        checks['mongodb'] = 'not configured (file fallback)'
    healthy = checks['sql'] == 'ok'
    return JsonResponse(
        {'status': 'ok' if healthy else 'degraded', 'uptime_s': int(time.time() - STARTED), 'checks': checks},
        status=200 if healthy else 503,
    )


def handler404(request, exception=None):
    if request.path.startswith('/api/'):
        return _error(404, '404', 'Unknown API endpoint.')
    return render(request, '404.html', status=404)


def handler500(request):
    if request.path.startswith('/api/'):
        return _error(500, '500', 'Internal error.')
    return render(request, '500.html', status=500)


def handler403(request, exception=None):
    return _error(403, '403', 'Forbidden.')


def handler400(request, exception=None):
    return _error(400, '400', 'Bad request.')
