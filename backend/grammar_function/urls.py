from django.urls import path
from .views import (
    CopyWritingView,
    DataFormatterView,
    EmailGeneratorView,
    IdeaGeneratorView,
    ProofreaderView,
    RewriterView,
    SentimentAnalyzerView,
    SocialMediaPostGeneratorView,
    SummarizerView,
    TranslatorView,
    WriterView,
)

urlpatterns = [
    path("proofreader/", ProofreaderView.as_view(), name="proofreader"),
    path("summarizer/", SummarizerView.as_view(), name="summarizer"),
    path("writer/", WriterView.as_view(), name="writer"),
    path("rewriter/", RewriterView.as_view(), name="rewriter"),
    path("translator/", TranslatorView.as_view(), name="translator"),
    path("sentiment-analyzer/", SentimentAnalyzerView.as_view(), name="sentiment-analyzer"),
    path("copywriting/", CopyWritingView.as_view(), name="copywriting"),
    path("email/", EmailGeneratorView.as_view(), name="email"),
    path("social-media-post-generator/", SocialMediaPostGeneratorView.as_view(), name="social-media-post-generator"),
    path("idea-generator/", IdeaGeneratorView.as_view(), name="idea-generator"),
    path("data-formatter/", DataFormatterView.as_view(), name="data-formatter"),
]
