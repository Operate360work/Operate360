# serializers.py

from rest_framework import serializers
from .models import FormDefinition


class FormDefinitionSerializer(serializers.ModelSerializer):

    class Meta:
        model = FormDefinition

        fields = [
            "id",
            "name",
            "code",
            "version",
            "structure",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "version",
            "created_at",
            "updated_at",
        ]