import json
from unittest.mock import patch

from django.test import Client, TestCase
from django.urls import reverse

from ai_service import empty_usage
from core.helper import API_KEY_COOKIE_NAME, encrypt_api_key
from core.models import ChatRecord


class SavedHistoryTests(TestCase):
    def setUp(self):
        self.client.cookies[API_KEY_COOKIE_NAME] = encrypt_api_key('history-owner-key')
        self.answer = '# A complete answer\n\n' + ('A useful paragraph. ' * 40) + '\n\n```json\n{"complete": true}\n```'
        self.record = ChatRecord.objects.create(
            api_key='history-owner-key', method='prompt', prompt='A long question ' * 25,
            response=json.dumps({'response': self.answer}),
            conversation=[{'role': 'user', 'content': 'Remembered preference'}],
            model='test-model', tokens_in=10, tokens_out=20, cost=0.25,
        )
        self.other = ChatRecord.objects.create(
            api_key='different-owner-key', method='prompt', prompt='Private question', response='Private answer',
        )

    def detail(self, record=None):
        return reverse('history-detail', args=[(record or self.record).pk])

    def reply(self, record=None):
        return reverse('history-reply', args=[(record or self.record).pk])

    def post_reply(self, payload):
        return self.client.post(self.reply(), json.dumps(payload), content_type='application/json')

    def test_sidebar_previews_have_ids_and_readable_text_and_detail_is_not_truncated(self):
        previews = self.client.get(reverse('history')).data['data']
        self.assertEqual(len(previews), 1)
        self.assertEqual(previews[0]['id'], self.record.pk)
        self.assertEqual(previews[0]['response'], self.answer[:180])
        self.assertNotIn('conversation', previews[0])
        full = self.client.get(self.detail()).data['data']
        self.assertEqual(full['response'], self.answer)
        self.assertEqual(full['prompt'], self.record.prompt)
        self.assertEqual(full['conversation'], self.record.conversation)

    def test_structured_and_legacy_plain_replies_are_preserved(self):
        for stored, expected in [
            ('Plain reply', 'Plain reply'),
            ('{"response": {"rows": [1, 2]}}', '{\n  "rows": [\n    1,\n    2\n  ]\n}'),
            ('{"rows":[1,2]}', '{"rows":[1,2]}'),
        ]:
            with self.subTest(stored=stored):
                self.record.response = stored
                self.record.save()
                self.assertEqual(self.client.get(self.detail()).data['data']['response'], expected)

    def test_history_cannot_be_read_replied_to_or_deleted_by_another_key(self):
        for method, url in [('get', self.detail(self.other)), ('delete', self.detail(self.other)), ('post', self.reply(self.other))]:
            with self.subTest(method=method):
                self.assertEqual(getattr(self.client, method)(url).status_code, 404)
        self.other.refresh_from_db()
        self.assertEqual(self.other.prompt, 'Private question')

    def test_every_history_operation_requires_a_key(self):
        anonymous = Client()
        for method, url in [('get', reverse('history')), ('delete', reverse('history')),
                            ('get', self.detail()), ('delete', self.detail()), ('post', self.reply())]:
            with self.subTest(method=method, url=url):
                self.assertEqual(getattr(anonymous, method)(url).status_code, 401)

    @patch('core.views.describe_account', return_value=None)
    def test_delete_erases_saved_text_and_context_but_retains_usage(self, _account):
        before = self.client.get(reverse('usage')).data['data']['totals']
        self.assertEqual(self.client.delete(self.detail()).status_code, 200)
        self.record.refresh_from_db()
        self.assertTrue(self.record.history_deleted)
        self.assertEqual((self.record.prompt, self.record.response, self.record.conversation), ('', '', []))
        self.assertEqual(self.client.get(reverse('history')).data['data'], [])
        self.assertEqual(self.client.get(self.detail()).status_code, 404)
        self.assertEqual(self.post_reply({'prompt': 'follow up'}).status_code, 404)
        self.assertEqual(self.client.get(reverse('usage')).data['data']['totals'], before)

    def test_clear_history_scrubs_batch_text_too_and_leaves_other_owners_alone(self):
        batch = ChatRecord.objects.create(api_key='history-owner-key', method='writer', batch=True, prompt='Batch prompt', response='Batch reply')
        response = self.client.delete(reverse('history'))
        self.assertEqual(response.data['data']['deleted'], 2)
        batch.refresh_from_db()
        self.other.refresh_from_db()
        self.assertEqual(batch.response, '')
        self.assertTrue(batch.history_deleted)
        self.assertFalse(self.other.history_deleted)
        self.assertEqual(self.client.delete(reverse('history')).data['data']['deleted'], 0)

    @patch('core.views.generate_response_with_usage', return_value=('A targeted reply', empty_usage('test-model')))
    def test_reply_uses_selected_context_and_saves_a_new_full_exchange(self, generate):
        selected = [{'role': 'user', 'content': 'Chosen question'}, {'role': 'assistant', 'content': 'Chosen answer'}]
        result = self.post_reply({'prompt': 'Make it shorter', 'conversation': selected})
        self.assertEqual(result.status_code, 200)
        self.assertEqual(generate.call_args.kwargs['conversation'], selected)
        self.assertIn('Chat reply', generate.call_args.kwargs['system_instruction_string'])
        self.assertIn('not verified facts', generate.call_args.kwargs['system_instruction_string'])
        saved = ChatRecord.objects.latest('id')
        self.assertEqual((saved.prompt, saved.response, saved.conversation), ('Make it shorter', 'A targeted reply', selected))
        self.assertEqual(saved.api_key_hash, self.record.api_key_hash)
        self.assertEqual(saved.method, self.record.method)

    @patch('core.views.generate_response_with_usage', return_value=('Reply', empty_usage()))
    def test_reply_defaults_to_the_requested_saved_exchange_for_legacy_clients(self, generate):
        self.assertEqual(self.post_reply({'prompt': 'Explain this answer'}).status_code, 200)
        self.assertEqual(generate.call_args.kwargs['conversation'], [
            *self.record.conversation,
            {'role': 'user', 'content': self.record.prompt.strip()},
            {'role': 'assistant', 'content': self.answer},
        ])

    @patch('core.views.generate_response_with_usage', return_value=('Reply', empty_usage()))
    def test_only_bounded_valid_context_is_saved_on_chat_endpoints(self, _generate):
        turns = [{'role': 'user', 'content': f'Question {i}'} for i in range(25)]
        turns.append({'role': 'system', 'content': 'Not a permitted memory'})
        for endpoint in [self.reply(), reverse('prompt'), reverse('explainer')]:
            with self.subTest(endpoint=endpoint):
                response = self.client.post(endpoint, json.dumps({'prompt': 'New question', 'conversation': turns}), content_type='application/json')
                self.assertEqual(response.status_code, 200)
                self.assertEqual(ChatRecord.objects.latest('id').conversation, turns[5:25])

    @patch('core.views.generate_response_with_usage')
    def test_invalid_replies_do_not_call_the_provider(self, generate):
        for value in ['', '  ', None, {'wrong': 'type'}]:
            with self.subTest(value=value):
                self.assertEqual(self.post_reply({'prompt': value}).status_code, 400)
        generate.assert_not_called()

    @patch('core.views.generate_response_with_usage', side_effect=RuntimeError('provider unavailable'))
    def test_failed_reply_does_not_create_a_saved_record(self, _generate):
        before = ChatRecord.objects.count()
        self.assertEqual(self.post_reply({'prompt': 'Try again'}).status_code, 500)
        self.assertEqual(ChatRecord.objects.count(), before)
