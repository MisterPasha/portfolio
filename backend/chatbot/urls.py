from django.urls import path
from . import views

urlpatterns = [
    path("session/", views.session, name="pavelbot-session"),
    path("message/", views.chat, name="pavelbot-message"),
]
