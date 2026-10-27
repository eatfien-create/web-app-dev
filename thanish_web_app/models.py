from django.db import models


class FAQ(models.Model):
    category = models.CharField(max_length=60)
    question = models.CharField(max_length=255)
    answer = models.TextField()
    keywords = models.CharField(max_length=255, blank=True, help_text='Comma separated')
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']
        verbose_name = 'FAQ'

    def __str__(self):
        return self.question


class ErrorCode(models.Model):
    code = models.CharField(max_length=12, unique=True)
    title = models.CharField(max_length=80)
    meaning = models.TextField()
    fix = models.TextField()

    class Meta:
        ordering = ['code']

    def __str__(self):
        return f'{self.code} {self.title}'


class SupportTicket(models.Model):
    STATUS = [('open', 'Open'), ('closed', 'Closed')]
    email = models.EmailField(blank=True)
    subject = models.CharField(max_length=160)
    message = models.TextField()
    source = models.CharField(max_length=20, default='assistant')
    status = models.CharField(max_length=10, choices=STATUS, default='open')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'#{self.pk} {self.subject}'


class Chamber(models.Model):
    name = models.CharField(max_length=80)
    species_key = models.CharField(max_length=40, default='nepenthes_villosa')
    notes = models.TextField(blank=True)

    def __str__(self):
        return self.name


class DiurnalProgram(models.Model):
    chamber = models.ForeignKey(Chamber, on_delete=models.CASCADE, related_name='programs')
    name = models.CharField(max_length=80)
    schedule = models.JSONField(default=dict)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class SensorLog(models.Model):
    chamber = models.ForeignKey(Chamber, on_delete=models.CASCADE, related_name='logs')
    temp_c = models.FloatField()
    rh = models.FloatField()
    vpd_kpa = models.FloatField()
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-recorded_at']
