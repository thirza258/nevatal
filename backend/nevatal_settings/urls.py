"""
URL configuration for nevatal_settings project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
import os

from django.conf import settings
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from django.http import HttpResponse

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", lambda request: HttpResponse("Status: OK")),
    # One prefix, three apps: core carries the session and history, and each
    # function app carries its own use case. Paths are unchanged by the split.
    path("api/v1/", include("core.urls")),
    path("api/v1/", include("grammar_function.urls")),
    path("api/v1/", include("document_function.urls")),
]

# The schema and its two browsers enumerate every endpoint and every field the
# API accepts, which is a map of the attack surface handed to anyone who asks.
# They are a development convenience, so they are only mounted in development.
# Set SCHEMA_PUBLIC=True to serve them anyway.
if settings.DEBUG or os.getenv("SCHEMA_PUBLIC", "False") == "True":
    urlpatterns += [
        path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
        path("api/schema/swagger-ui/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
        path("api/schema/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    ]

