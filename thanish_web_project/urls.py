from django.contrib import admin
from django.urls import path

from thanish_web_app import views

handler400 = 'thanish_web_app.views.handler400'
handler403 = 'thanish_web_app.views.handler403'
handler404 = 'thanish_web_app.views.handler404'
handler500 = 'thanish_web_app.views.handler500'

urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/', views.health, name='health'),
    path('api/faqs/', views.faqs),
    path('api/errors/', views.error_codes),
    path('api/chat/', views.chat),
    path('api/feedback/', views.feedback),
    path('api/ticket/', views.ticket),
    path('api/tickets/', views.ticket_list),
    path('api/ticket/<int:pk>/', views.ticket_detail),
    path('api/weather/', views.weather),
    # SPA pages (anything else falls through to the custom 404)
    path('', views.spa, name='home'),
    path('chamber/', views.spa),
    path('schedule/', views.spa),
    path('species/', views.spa),
    path('faq/', views.spa),
    path('errors/', views.spa),
    path('status/', views.spa),
    path('support/', views.spa),
]
