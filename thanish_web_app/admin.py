from django.contrib import admin

from .models import FAQ, Chamber, DiurnalProgram, ErrorCode, SensorLog, SupportTicket

for model in (FAQ, ErrorCode, SupportTicket, Chamber, DiurnalProgram, SensorLog):
    admin.site.register(model)
