from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("core", "0007_drop_stored_api_key")]

    operations = [
        migrations.AddField(
            model_name="chatrecord", name="conversation",
            field=models.JSONField(default=list, blank=True),
        ),
        migrations.AddField(
            model_name="chatrecord", name="history_deleted",
            field=models.BooleanField(default=False, db_index=True),
        ),
    ]
