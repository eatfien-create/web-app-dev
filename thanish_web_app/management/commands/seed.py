from django.core.management.base import BaseCommand

from thanish_web_app.models import FAQ, Chamber, ErrorCode

FAQS = [
    ('Basics', 'What is VPD and why does it matter more than humidity?',
     'VPD (vapor pressure deficit) is the gap between how much water vapor the air holds and how much it could hold at that temperature. 80% RH at 30°C pulls far more water from a leaf than 80% at 15°C, so VPD is the number plants and frogs actually respond to.',
     'vpd vapor pressure deficit humidity'),
    ('Basics', 'What VPD range should I aim for?',
     'Roughly 0.4-0.8 kPa for most cloud forest species. Below 0.2 kPa risks condensation and mold; above 1.4 kPa causes stomatal shutdown and stress.',
     'vpd range target kpa ideal'),
    ('Basics', 'How is the leaf temperature offset used?',
     'Evaporative cooling makes leaves slightly cooler than the air. The offset dial (-2°C to +1°C) shifts leaf temperature in the VPD formula so the heatmap reflects what the plant really feels.',
     'leaf offset temperature dial cooling'),
    ('Species', 'Why do highland Nepenthes need a night temperature drop?',
     'Highland species evolved with cool, foggy nights (about 9-14°C). Without the drop they stop producing healthy pitchers. Use the night program with the ultrasonic fogger to hit about 98% RH.',
     'nepenthes night drop cold highland pitcher'),
    ('Species', 'Can I keep dart frogs and plants in the same chamber profile?',
     'Yes, if the species envelopes overlap. Select several species in the catalog; the heatmap shows where their tolerance ranges intersect. Ranitomeya prefer warmer nights (18-20°C) than highland Nepenthes.',
     'dart frog ranitomeya together mix plants'),
    ('Species', 'What is the Daily Light Integral (DLI)?',
     'DLI = PPFD x hours of light x 0.0036, in mol of photons per m² per day. Carnivorous plants usually want a DLI of 15-30 for good pitcher pigmentation. The Schedule page calculates it from your light curve.',
     'dli daily light integral ppfd light'),
    ('Schedule', 'How does the diurnal schedule work?',
     'Light ramps from 3000K amber at dawn to 6500K at noon, 2700K at dusk, then a 0.5% indigo moonlight at night. Rain, fog and fan events are triggered on a 24-hour timeline.',
     'schedule diurnal sunrise kelvin timeline photoperiod'),
    ('Schedule', 'When does the fogger run?',
     'By default 22:00 to 04:00, to hold roughly 98% night humidity without soaking leaves. You can edit the window on the Schedule page.',
     'fogger fog night mist ultrasonic'),
    ('Schedule', 'Why does the fan run after rain?',
     'A 10-minute anti-fungal purge after each rain burst clears stagnant, saturated air from leaf surfaces and prevents fungal growth.',
     'fan purge rain fungal stagnant airflow'),
    ('Account', 'Does VivariaOS control real hardware?',
     'This version is a simulator and planner. The relay rack shows what a connected controller would do, but it does not switch real devices.',
     'hardware relay control real devices'),
    ('Account', 'Where does the outdoor weather on the dashboard come from?',
     'From the Open-Meteo API with a 3 second timeout. If it is slow or down, the dashboard falls back to default values and labels them as fallback data.',
     'weather outdoor open-meteo api fallback'),
    ('Support', 'What happens if the assistant cannot answer my question?',
     'It offers to create a support ticket. Tickets are stored in our SQL database and answered by a person.',
     'ticket support help contact human'),
]

ERRORS = [
    ('400', 'Bad Request', 'The request was malformed or missing a required field.', 'Check the message length (1-500 characters) and required fields, then retry.'),
    ('401', 'Unauthorized', 'Authentication is required for this action.', 'Sign in again; admin pages need a valid login.'),
    ('403', 'Forbidden', 'You are signed in but not allowed to do this.', 'Ask the chamber owner for access.'),
    ('404', 'Not Found', 'The page or resource does not exist.', 'Check the address, or use the assistant to find what you need.'),
    ('429', 'Too Many Requests', 'You sent more than 20 chat messages in a minute.', 'Wait a minute and try again.'),
    ('500', 'Internal Server Error', 'Something broke on our side.', 'Retry shortly. If it persists, create a support ticket.'),
    ('503', 'Service Unavailable', 'A dependency (database) is down or the site is under maintenance.', 'Check the Status page and retry in a few minutes.'),
    ('VIV-901', 'Sensor Offline', 'A chamber sensor stopped reporting readings.', 'Check the probe cable and power, then re-add the probe in the chamber view.'),
]


class Command(BaseCommand):
    help = 'Seed FAQs, error codes and a demo chamber'

    def handle(self, *args, **opts):
        for i, (cat, q, a, kw) in enumerate(FAQS):
            FAQ.objects.update_or_create(question=q, defaults={'category': cat, 'answer': a, 'keywords': kw, 'order': i})
        for code, title, meaning, fix in ERRORS:
            ErrorCode.objects.update_or_create(code=code, defaults={'title': title, 'meaning': meaning, 'fix': fix})
        Chamber.objects.get_or_create(name='Chamber Alpha — Highland Tepui Biome')
        self.stdout.write(self.style.SUCCESS(f'{FAQ.objects.count()} FAQs, {ErrorCode.objects.count()} error codes'))
