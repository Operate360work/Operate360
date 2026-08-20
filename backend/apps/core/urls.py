# urls.py

from rest_framework.routers import DefaultRouter

from .views import FormDefinitionViewSet


router = DefaultRouter()

router.register(
    "forms",
    FormDefinitionViewSet,
    basename="forms"
)

urlpatterns = router.urls