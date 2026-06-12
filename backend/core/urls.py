from django.urls import path
from .views import PromptView, ProofreaderView, SummarizerView, TranslatorView, WriterView, RewriterView, ApiKeyCheckView, ApiKeyClearView, HistoryView
from .views import CopyWritingView, ImageGeneratorView, ExplainerView, PDFUploadRAGView, RAGChatView, EmailGeneratorView
from .views import MeetingSummaryView, SocialMediaPostGeneratorView, SentimentAnalyzerView

urlpatterns = [
    path("prompt/", PromptView.as_view(), name="prompt"),
    path("proofreader/", ProofreaderView.as_view(), name="proofreader"),
    path("summarizer/", SummarizerView.as_view(), name="summarizer"),
    path("copywriting/", CopyWritingView.as_view(), name="copywriting"),
    path("translator/", TranslatorView.as_view(), name="translator"),
    path("writer/", WriterView.as_view(), name="writer"),
    path("rewriter/", RewriterView.as_view(), name="rewriter"),
    path("image/", ImageGeneratorView.as_view(), name="image"),
    path("explainer/", ExplainerView.as_view(), name="explainer"),
    path("pdf-upload/", PDFUploadRAGView.as_view(), name="pdf-upload"),
    path("rag-chat/", RAGChatView.as_view(), name="rag-chat"),
    path("api-key-check/", ApiKeyCheckView.as_view(), name="api-key-check"),
    path("api-key-clear/", ApiKeyClearView.as_view(), name="api-key-clear"),
    path("openai/api-key-check/", ApiKeyCheckView.as_view(provider="openai"), name="openai-api-key-check"),
    path("openrouter/api-key-check/", ApiKeyCheckView.as_view(provider="openrouter"), name="openrouter-api-key-check"),
    path("langchain/api-key-check/", ApiKeyCheckView.as_view(provider="gemini"), name="langchain-api-key-check"),
    path("history/", HistoryView.as_view(), name="history"),
    path("email/", EmailGeneratorView.as_view(), name="email"),
    path("meeting-summary/", MeetingSummaryView.as_view(), name="meeting-summary"),
    path("social-media-post-generator/", SocialMediaPostGeneratorView.as_view(), name="social-media-post-generator"),
    path("sentiment-analyzer/", SentimentAnalyzerView.as_view(), name="sentiment-analyzer"),
]
