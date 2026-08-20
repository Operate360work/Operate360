import uuid

from django.db import models


class FormDefinition(models.Model):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    name = models.CharField(
        max_length=200
    )

    code = models.CharField(
        max_length=100,
        unique=True
    )

    version = models.PositiveIntegerField(
        default=1
    )

    structure = models.JSONField(
        default=dict
    )

    is_active = models.BooleanField(
        default=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        db_table = "form_definitions"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} v{self.version}"