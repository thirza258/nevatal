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
    ]

    method = models.CharField(max_length=255, choices=METHOD_CHOICES, default='prompt')
    prompt = models.TextField()
    response = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    api_key = models.TextField(default='')
    api_key_hash = models.CharField(max_length=64, db_index=True, default='')

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
