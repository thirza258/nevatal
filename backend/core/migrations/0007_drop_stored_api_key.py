"""
Stop storing provider API keys in chat records.

`ChatRecord.api_key` held the user's provider key, re-encrypted with a cipher
derived from SECRET_KEY. That made every row a recoverable credential: a
database dump plus that secret yielded live keys, and the secret had a
published default. Nothing read the column — history and usage are looked up
by `api_key_hash` — so it is removed rather than merely cleared, because a
dropped column cannot be dumped.

Rows written before hashing existed carry a key but no fingerprint. Those are
attributed first, so their owners keep their history, and only then is the
column dropped.
"""

from django.db import migrations


def backfill_fingerprints(apps, schema_editor):
    ChatRecord = apps.get_model("core", "ChatRecord")

    # Imported here, not at module scope: this reaches into current app code,
    # which is fine while the migration runs but should not be a side effect of
    # importing the migration.
    from core.helper import decrypt_api_key, fingerprint_api_key

    unattributed = ChatRecord.objects.filter(api_key_hash="").exclude(api_key="")
    updated = []
    for record in unattributed.iterator(chunk_size=500):
        try:
            raw_key = decrypt_api_key(record.api_key)
        except Exception:
            # A row encrypted under a SECRET_KEY that has since been rotated
            # cannot be attributed. Its text stays; only the link is lost.
            continue
        if not raw_key:
            continue
        record.api_key_hash = fingerprint_api_key(raw_key)
        updated.append(record)
        if len(updated) >= 500:
            ChatRecord.objects.bulk_update(updated, ["api_key_hash"])
            updated = []

    if updated:
        ChatRecord.objects.bulk_update(updated, ["api_key_hash"])


def noop(apps, schema_editor):
    """Nothing to undo: the fingerprints are what the new code reads."""


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0006_chatrecord_batch_chatrecord_cost_chatrecord_model_and_more"),
    ]

    operations = [
        migrations.RunPython(backfill_fingerprints, noop),
        migrations.RemoveField(model_name="chatrecord", name="api_key"),
    ]
