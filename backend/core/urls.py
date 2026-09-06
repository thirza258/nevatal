from django.urls import path
from .views import (
    ApiKeyCheckView,
    ApiKeyClearView,
    ExplainerView,
    HistoryView,
    KeyRotateView,
    KeySwitchView,
    KeysView,
    ModelListView,
    PromptView,
    PublicKeyView,
    UsageView,
)

urlpatterns = [
    path("prompt/", PromptView.as_view(), name="prompt"),
    path("explainer/", ExplainerView.as_view(), name="explainer"),
    path("public-key/", PublicKeyView.as_view(), name="public-key"),
    path("api-key-check/", ApiKeyCheckView.as_view(), name="api-key-check"),
    path("api-key-clear/", ApiKeyClearView.as_view(), name="api-key-clear"),
    path("openai/api-key-check/", ApiKeyCheckView.as_view(provider="openai"), name="openai-api-key-check"),
    path("openrouter/api-key-check/", ApiKeyCheckView.as_view(provider="openrouter"), name="openrouter-api-key-check"),
    path("gemini/api-key-check/", ApiKeyCheckView.as_view(provider="gemini"), name="gemini-api-key-check"),
    path("history/", HistoryView.as_view(), name="history"),
    path("models/", ModelListView.as_view(), name="models"),
    path("usage/", UsageView.as_view(), name="usage"),
    path("keys/", KeysView.as_view(), name="keys"),
    path("keys/switch/", KeySwitchView.as_view(), name="key-switch"),
    path("keys/rotate/", KeyRotateView.as_view(), name="key-rotate"),
    path("keys/<int:index>/", KeysView.as_view(), name="key"),
]
