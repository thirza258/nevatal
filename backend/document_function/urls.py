from django.urls import path
from .views import (
    DataAnalysisView,
    AnalyzeTextView,
    DirectExtractionView,
    ImageGeneratorView,
    MeetingSummaryView,
    PDFUploadRAGView,
    RAGChatView,
    RAGDocumentsView,
)

urlpatterns = [
    path("direct-extraction/", DirectExtractionView.as_view(), name="direct-extraction"),
    path("analyze-text/", AnalyzeTextView.as_view(), name="analyze-text"),
    path("data-analysis/", DataAnalysisView.as_view(), name="data-analysis"),
    path("pdf-upload/", PDFUploadRAGView.as_view(), name="pdf-upload"),
    path("rag-chat/", RAGChatView.as_view(), name="rag-chat"),
    path("rag-documents/", RAGDocumentsView.as_view(), name="rag-documents"),
    path("rag-documents/<int:document_id>/", RAGDocumentsView.as_view(), name="rag-document"),
    path("meeting-summary/", MeetingSummaryView.as_view(), name="meeting-summary"),
    path("image/", ImageGeneratorView.as_view(), name="image"),
]
