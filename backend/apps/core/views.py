# views.py

from rest_framework.viewsets import ModelViewSet

from .models import FormDefinition
from .serializers import FormDefinitionSerializer


class FormDefinitionViewSet(ModelViewSet):

    queryset = FormDefinition.objects.all()

    serializer_class = FormDefinitionSerializer