from django.db import models
from django.db.models import JSONField
from core.helper import decrypt_api_key, encrypt_api_key, fingerprint_api_key


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
    api_key = models.TextField(default='')
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

    def save(self, *args, **kwargs):
        raw_api_key = decrypt_api_key(self.api_key)
        if raw_api_key:
            self.api_key = encrypt_api_key(raw_api_key)
            self.api_key_hash = fingerprint_api_key(raw_api_key)
        elif not self.api_key_hash:
            self.api_key_hash = ""

        super().save(*args, **kwargs)

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
