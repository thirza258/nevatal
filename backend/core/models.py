from django.db import models
from django.db.models import JSONField
from core.helper import decrypt_api_key, fingerprint_api_key


class ChatRecord(models.Model):

    METHOD_CHOICES = [
        ('prompt', 'Prompt'),
        ('proofreader', 'Proofreader'),
        ('summarizer', 'Summarizer'),
        ('translator', 'Translator'),
        ('writer', 'Writer'),
        ('rewriter', 'Rewriter'),
        ('explainer', 'Explainer'),
        ('copywriting', 'Copywriting'),
        ('document_ai', 'Document AI'),
        ('email_generator', 'Email Generator'),
        ('rag_chat', 'RAG Chat'),
        ('email_generation', 'Email Generation'),
        # Methods the views were already writing without being listed here,
        # which left them out of any per-tool breakdown.
        ('sentiment_analysis', 'Sentiment Analysis'),
        ('image_generation', 'Image Generation'),
        ('meeting_summary', 'Meeting Summary'),
        ('social_media_post_generation', 'Social Media Post'),
        ('direct_extraction', 'Direct Extraction'),
        ('analyze_text', 'Analyze Text'),
        ('code_generation', 'Code Generation'),
        ('code_reviewer', 'Code Reviewer'),
        ('idea_generation', 'Idea Generator'),
        ('data_formatting', 'Data Formatter'),
        ('data_analysis', 'Data Analysis'),
    ]

    method = models.CharField(max_length=255, choices=METHOD_CHOICES, default='prompt')
    prompt = models.TextField()
    response = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    # There is deliberately no column for the provider key — only the
    # one-way fingerprint below. `api_key` still exists as a write-only
    # property so callers can keep handing over the key they are holding.
    api_key_hash = models.CharField(max_length=64, db_index=True, default='')

    # What the generation ran on and what it consumed. Token counts are the
    # provider's own; `cost` is this app's estimate from published prices, and
    # stays null for a provider that publishes none, because a guessed figure
    # on a spend screen is worse than a blank one.
    model = models.CharField(max_length=255, default='', blank=True)
    tokens_in = models.PositiveIntegerField(null=True, blank=True)
    tokens_out = models.PositiveIntegerField(null=True, blank=True)
    cost = models.FloatField(null=True, blank=True)

    # One item of a batch run: counted in usage, hidden from the sidebar.
    batch = models.BooleanField(default=False, db_index=True)

    def __str__(self):
        return self.method

    @property
    def api_key(self):
        """
        Write-only. Assigning a provider key records its fingerprint and
        discards the key itself; reading it back gives nothing, because
        nothing was kept.

        This used to be a real column holding the key re-encrypted with a
        cipher derived from SECRET_KEY, which made every row of this table a
        recoverable credential — a database dump plus that secret yielded live
        provider keys. Nothing needed it: history and usage are both looked up
        by `api_key_hash`. It is a property rather than simply being deleted so
        that the views, which legitimately hold a raw key, can go on passing
        `api_key=...` and have the right thing happen.
        """
        return ""

    @api_key.setter
    def api_key(self, value):
        raw_api_key = decrypt_api_key(value)
        if raw_api_key:
            self.api_key_hash = fingerprint_api_key(raw_api_key)

class RagChunk(models.Model):
    """
    Legacy chunk storage. Document AI now persists chunks and embeddings to
    media/rag/<owner>/<n>/index.pkl instead, so nothing writes here any more.
    Kept until the rows can be dropped in a deliberate migration.
    """

    source = models.CharField(max_length=255)       
    text = models.TextField()                       
    embedding = models.JSONField(default=list) 
    metadata = JSONField(default=dict, blank=True) 
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Chunk {self.id} ({self.source})"
