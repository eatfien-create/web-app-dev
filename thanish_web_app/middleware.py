import logging
import time

logger = logging.getLogger('vivaria.requests')


class RequestLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.monotonic()
        response = self.get_response(request)
        ms = (time.monotonic() - start) * 1000
        ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', '-')).split(',')[0]
        logger.info('%s %s %s %s %.1fms', ip, request.method, request.get_full_path(), response.status_code, ms)
        return response
