"""
Cross-cutting endpoints: the API key session, saved history, and the
open-ended model calls that belong to no single use case.

The use-case endpoints live with their own app — text work in
`grammar_function`, files and media in `document_function`. Every app's URLs
are still mounted under /api/v1/, so the paths are unchanged.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import logging
from datetime import timedelta
from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from core.helper import (
    clear_api_key_cookie,
    encrypt_api_key,
    fingerprint_api_key,
    resolve_api_key_from_request,
    resolve_api_key_header as strip_authentication_header,
    resolve_batch_from_request,
    resolve_conversation_from_request,
    resolve_model_from_request,
    resolve_output_format_from_request,
    set_api_key_cookie,
)
from core.crypto import get_public_key_payload
from core.keys import (
    API_KEYS_COOKIE_NAME,
    KEY_SLOT_LIMIT,
    describe_slots,
    load_slots,
    slots_with_key,
    store_slots,
)
from core.mixins import AIServiceMixin
from core.models import ChatRecord
from ai_service import (
    describe_account,
    generate_response_with_usage,
    list_models,
    normalize_provider,
    test_api_key,
)



logger = logging.getLogger(__name__)


class PublicKeyView(APIView):
    """
    Hand out the RSA public key the browser wraps the provider API key with.

    Public by design: it is the encryption half of the pair, and the key only
    becomes readable again inside this backend.
    """

    def get(self, request):
        try:
            return Response({
                "status": 200,
                "message": "success",
                "data": get_public_key_payload(),
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Could not produce the transport public key: {e}")
            return Response({
                "status": 500,
                "message": "error",
                "data": "The encryption key is unavailable.",
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ApiKeyCheckView(AIServiceMixin,APIView):
    provider = None

    def get(self, request):
        api_key = strip_authentication_header(request.headers.get('Authorization'))
        provider = (
            getattr(self, "provider", None)
            or request.query_params.get("provider")
            or request.headers.get("X-AI-Provider")
        )
        if not api_key:
            return Response({
                "status": status.HTTP_401_UNAUTHORIZED,
                "message": "API key not provided",
                "data": False
            }, status=status.HTTP_401_UNAUTHORIZED)

        try:
            response = test_api_key(
                api_key,
                provider=normalize_provider(provider, api_key),
            )
            if isinstance(response, dict) and "error" in response:
                return Response(
                    {
                        "status": status.HTTP_401_UNAUTHORIZED,
                        "message": "Invalid API key",
                        "data": False,
                    },
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            if response and not (isinstance(response, dict) and response.get("error", {}).get("code") == 401 and response.get("error", {}).get("message") == "API key not valid. Please pass a valid API key."):
                validated_response = Response({
                    "status": status.HTTP_200_OK,
                    "message": "API key is valid",
                    "data": {"valid": True},
                }, status=status.HTTP_200_OK)
                # The key that opened the session is its first slot, so the
                # keys screen shows the session it is actually running on.
                try:
                    slots, _active_index = load_slots(request)
                    slots, active_index = slots_with_key(slots, api_key)
                    return store_slots(validated_response, slots, active_index)
                except ValueError:
                    return set_api_key_cookie(
                        validated_response,
                        encrypt_api_key(api_key),
                    )
            else:
                return Response({
                    "status": status.HTTP_401_UNAUTHORIZED,
                    "message": "Invalid API key",
                    "data": False
                }, status=status.HTTP_401_UNAUTHORIZED)

        except Exception as e:
            logger.error(f"API key validation failed: {e}")

            if "API key not valid" in str(e) or "API_KEY_INVALID" in str(e):
                return Response({
                    "status": status.HTTP_401_UNAUTHORIZED,
                    "message": "Invalid API key",
                    "data": False
                }, status=status.HTTP_401_UNAUTHORIZED)
            return Response({
                "status": status.HTTP_400_BAD_REQUEST,
                "message": f"Error: {str(e)}",
                "data": False
            }, status=status.HTTP_400_BAD_REQUEST)


class ApiKeyClearView(APIView):
    def post(self, request):
        response = Response(
            {
                "status": status.HTTP_200_OK,
                "message": "API key cleared",
                "data": {"valid": False},
            },
            status=status.HTTP_200_OK,
        )
        # Clearing the key clears every spare with it: "remove my key from this
        # browser" cannot leave four others behind.
        response.delete_cookie(API_KEYS_COOKIE_NAME, path="/")
        return clear_api_key_cookie(response)

class ModelListView(APIView):
    """
    The models this session's key can be pointed at.

    OpenRouter routes to hundreds of models and publishes the whole catalogue,
    so a session on an OpenRouter key gets every one of them and picks with
    `X-AI-Model`. The other providers answer with an empty list, which the
    frontend reads as "no choice to make on this key" and shows no picker for.

    `provider` is resolved from the key itself, not from what the browser
    claims, so a stale provider in localStorage cannot make the frontend
    believe it may choose a model.
    """

    def get(self, request):
        api_key = resolve_api_key_from_request(request)
        if not api_key:
            return Response({
                "status": status.HTTP_401_UNAUTHORIZED,
                "message": "API key not provided",
                "data": False,
            }, status=status.HTTP_401_UNAUTHORIZED)

        try:
            catalogue = list_models(api_key=api_key)
        except Exception as e:
            # An empty list would read as "this provider has no models", so a
            # provider that could not be reached says so instead.
            logger.error(f"Could not list the provider's models: {e}")
            return Response({
                "status": status.HTTP_502_BAD_GATEWAY,
                "message": "error",
                "data": "The provider's model list is unavailable right now.",
            }, status=status.HTTP_502_BAD_GATEWAY)

        return Response({
            "status": status.HTTP_200_OK,
            "message": "success",
            "data": catalogue,
        }, status=status.HTTP_200_OK)


class PromptView(AIServiceMixin, APIView):
    """
    API View for generating a response to a prompt.
    """

    def post(self, request, *args, **kwargs):
        """
        Handles POST requests to generate a response from a prompt.

        This method is responsible for request handling, validation, and
        returning an appropriate HTTP response.
        """
        prompt = request.data.get("prompt")
        api_key = request.headers.get('Authorization')
        api_key = strip_authentication_header(api_key)
        model = resolve_model_from_request(request)
        output_format = resolve_output_format_from_request(request)
        batch = resolve_batch_from_request(request)
        conversation = resolve_conversation_from_request(request)
        if not prompt:
            return Response(
                {"error": "A 'prompt' is required in the request body."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not api_key:
            return Response(
                {"error": "Authorization header is required."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            response_data, usage = generate_response_with_usage(
                prompt=prompt,
                api_key=api_key,
                model=model,
                output_format=output_format,
                conversation=conversation,
            )
            ChatRecord.objects.create(method='prompt', prompt=prompt, response=response_data, api_key=api_key, batch=batch, **usage)

            return Response({
                "status": 200,
                "message": "success",
                "data": response_data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"An unexpected error occurred while processing your request. {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ExplainerView(APIView):
    """
    API View for generating explainer based on the prompt.
    """

    def post(self, request, *args, **kwargs):
        """
        Handles POST requests to generate explainer.
        """
        prompt = request.data.get("prompt")
        api_key = request.headers.get('Authorization')
        api_key = strip_authentication_header(api_key)
        model = resolve_model_from_request(request)
        output_format = resolve_output_format_from_request(request)
        batch = resolve_batch_from_request(request)
        conversation = resolve_conversation_from_request(request)
        if not prompt:
            return Response(
                {"error": "A 'prompt' is required in the request body."},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            system_instruction_string = f"""
            You are a skilled explainer. Your task is to explain the given prompt in a way that is easy to understand.
            """
            response_data, usage = generate_response_with_usage(prompt=prompt, api_key=api_key, model=model,
                                                               output_format=output_format,
                                                               conversation=conversation,
                                                               system_instruction_string=system_instruction_string)
            ChatRecord.objects.create(method='explainer', prompt=prompt, response=response_data, api_key=api_key, batch=batch, **usage)
            return Response({
                "status": 200,
                "message": "success",
                "data": response_data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "status": 500,
                "message": "error",
                "data": "An unexpected error occurred while processing your request." + str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CodeGeneratorView(APIView):
    """
    API View for generating code from a text prompt using the Gemini API.

    Not routed yet — the matching frontend page is still a stub.
    """
    def post(self, request, *args, **kwargs):
        """
        Handles POST requests to generate code.
        """
        prompt = request.data.get("prompt")
        api_key = request.headers.get("Authorization")
        api_key = strip_authentication_header(api_key)
        model = resolve_model_from_request(request)
        output_format = resolve_output_format_from_request(request)
        batch = resolve_batch_from_request(request)
        if not prompt:
            return Response(
                {"error": "A 'prompt' is required in the request body."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not api_key:
            return Response(
                {"error": "Authorization header is required."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        try:
            system_instruction_string = f"""
            You are a skilled code generator. Your task is to generate code from a text prompt.
            The code should be generated based on the following prompt:
            """

            response_data, usage = generate_response_with_usage(prompt=prompt, api_key=api_key, model=model,
                                                               output_format=output_format,
                                                               system_instruction_string=system_instruction_string)
            ChatRecord.objects.create(method='code_generation', prompt=prompt, response=response_data, api_key=api_key, batch=batch, **usage)
            return Response({
                "status": 200,
                "message": "success",
                "data": response_data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "status": 500,
                "message": "error",
                "data": "An unexpected error occurred while processing your request." + str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CodeReviewerView(APIView):
    """
    API View for reviewing code from a text prompt using the Gemini API.

    Not routed yet — the matching frontend page is still a stub.
    """
    def post(self, request, *args, **kwargs):
        """
        Handles POST requests to review code.
        """
        prompt = request.data.get("prompt")
        api_key = request.headers.get("Authorization")
        api_key = strip_authentication_header(api_key)
        model = resolve_model_from_request(request)
        output_format = resolve_output_format_from_request(request)
        batch = resolve_batch_from_request(request)

        if not prompt:
            return Response(
                {"error": "A 'prompt' is required in the request body."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not api_key:
            return Response(
                {"error": "Authorization header is required."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        try:
            system_instruction_string = f"""
            You are a skilled code reviewer. Your task is to review the code and provide feedback.
            The code should be reviewed based on the following prompt:
            {prompt}
            """
            response_data, usage = generate_response_with_usage(prompt=prompt, api_key=api_key, model=model,
                                                               output_format=output_format,
                                                               system_instruction_string=system_instruction_string)
            ChatRecord.objects.create(method='code_reviewer', prompt=prompt, response=response_data, api_key=api_key, batch=batch, **usage)
            return Response({
                "status": 200,
                "message": "success",
                "data": response_data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "status": 500,
                "message": "error",
                "data": "An unexpected error occurred while processing your request." + str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class HistoryView(APIView):
    """
    API View for retrieving history of prompts.
    """
    def get(self, request):
        try:

            api_key = strip_authentication_header(request.headers.get('Authorization'))
            if not api_key:
                return Response(
                    {"error": "Authorization header is required."},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            # Batch rows are real work and count towards usage, but fifty
            # of them would bury the handful someone wants to find again.
            history = ChatRecord.objects.filter(
                Q(api_key_hash=fingerprint_api_key(api_key)) | Q(api_key=api_key)
            ).exclude(batch=True).order_by('-created_at')

            history_list = [
                {
                    "method": record.method,
                    "prompt": record.prompt[:100],
                    "response": record.response[:100],
                    "created_at": record.created_at,
                    "model": record.model,
                    "tokens_in": record.tokens_in,
                    "tokens_out": record.tokens_out,
                    "cost": record.cost,
                }
                for record in history
            ]
            return Response({
                "status": 200,
                "message": "success",
                "data": history_list
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "status": 500,
                "message": "error",
                "data": "An unexpected error occurred while processing your request." + str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _slots_response(slots, active_index, message="success", http_status=status.HTTP_200_OK):
    """The key slots as an API response — masked, never the keys themselves."""
    return Response(
        {
            "status": http_status,
            "message": message,
            "data": {
                "slots": describe_slots(slots, active_index),
                "active_index": active_index if slots else None,
                "limit": KEY_SLOT_LIMIT,
            },
        },
        status=http_status,
    )


class KeysView(APIView):
    """
    The provider keys this session holds.

    Several keys, one of them active, and a way to move between them: that is
    what makes a rate limit or an exhausted balance a hiccup rather than the
    end of the session. They are held encrypted in an httpOnly cookie exactly
    as the single key is, and the browser only ever sees them masked.
    """

    def get(self, request):
        slots, active_index = load_slots(request)
        return _slots_response(slots, active_index)

    def post(self, request):
        api_key = strip_authentication_header(request.headers.get("Authorization"))
        if not api_key:
            return Response(
                {
                    "status": status.HTTP_401_UNAUTHORIZED,
                    "message": "API key not provided",
                    "data": False,
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # A key that cannot generate is not worth keeping as a spare, so it is
        # checked with the provider before it is stored — the same check the
        # sign-in form makes.
        try:
            valid = test_api_key(api_key, provider=normalize_provider(None, api_key))
        except Exception as e:
            logger.error(f"Could not validate an added key: {e}")
            valid = False

        if not valid or (isinstance(valid, dict) and "error" in valid):
            return Response(
                {
                    "status": status.HTTP_401_UNAUTHORIZED,
                    "message": "Invalid API key",
                    "data": False,
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        slots, active_index = load_slots(request)
        try:
            slots, added_index = slots_with_key(slots, api_key, request.data.get("label"))
        except ValueError as e:
            return Response(
                {
                    "status": status.HTTP_400_BAD_REQUEST,
                    "message": "error",
                    "data": str(e),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # A spare should not take over a session that is working; the first key
        # has nothing to take over from.
        if len(slots) == 1:
            active_index = added_index

        response = _slots_response(slots, active_index, message="API key added")
        return store_slots(response, slots, active_index)

    def delete(self, request, index=None):
        slots, active_index = load_slots(request)
        if not slots or index is None or index < 0 or index >= len(slots):
            return Response(
                {
                    "status": status.HTTP_404_NOT_FOUND,
                    "message": "error",
                    "data": "No such key slot.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        removed_active = index == active_index
        slots = slots[:index] + slots[index + 1:]

        if not slots:
            response = _slots_response([], 0, message="API key removed")
            response.delete_cookie(API_KEYS_COOKIE_NAME, path="/")
            return clear_api_key_cookie(response)

        if removed_active or index < active_index:
            # Removing the active key moves the session onto the one that took
            # its place; removing an earlier one just shifts the index.
            active_index = min(active_index, len(slots) - 1)

        response = _slots_response(slots, active_index, message="API key removed")
        return store_slots(response, slots, active_index)


class KeySwitchView(APIView):
    """Generate with a different one of the session's keys from now on."""

    def post(self, request):
        slots, active_index = load_slots(request)
        if not slots:
            return Response(
                {
                    "status": status.HTTP_404_NOT_FOUND,
                    "message": "error",
                    "data": "This session holds no keys.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            index = int(request.data.get("index"))
        except (TypeError, ValueError):
            index = -1

        if index < 0 or index >= len(slots):
            return Response(
                {
                    "status": status.HTTP_400_BAD_REQUEST,
                    "message": "error",
                    "data": "No such key slot.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        response = _slots_response(slots, index, message="Active key changed")
        return store_slots(response, slots, index)


class KeyRotateView(APIView):
    """
    Move the session to its next key.

    The browser calls this when a request comes back rate-limited or out of
    credit, and retries once. With a single key there is nowhere to rotate to,
    which is worth saying rather than quietly doing nothing.
    """

    def post(self, request):
        slots, active_index = load_slots(request)
        if len(slots) < 2:
            return Response(
                {
                    "status": status.HTTP_409_CONFLICT,
                    "message": "error",
                    "data": "This session has no other key to rotate to.",
                },
                status=status.HTTP_409_CONFLICT,
            )

        next_index = (active_index + 1) % len(slots)
        response = _slots_response(slots, next_index, message="Rotated to the next key")
        return store_slots(response, slots, next_index)


class UsageView(APIView):
    """
    What this session has spent, as far as the app can tell.

    Token counts are the providers' own, recorded per request. `cost` is this
    app's estimate from published prices and is null where a provider publishes
    none — a blank is better than a made-up number on a spend screen. `account`
    is the provider's own balance where it exposes one, which is the figure a
    spending alert should really be compared against.
    """

    RECENT_DAYS = 30

    def get(self, request):
        api_key = resolve_api_key_from_request(request)
        if not api_key:
            return Response(
                {
                    "status": status.HTTP_401_UNAUTHORIZED,
                    "message": "API key not provided",
                    "data": False,
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        rows = ChatRecord.objects.filter(api_key_hash=fingerprint_api_key(api_key))
        totals = rows.aggregate(
            requests=Count("id"),
            tokens_in=Sum("tokens_in"),
            tokens_out=Sum("tokens_out"),
            cost=Sum("cost"),
        )

        by_model = list(
            rows.exclude(model="")
            .values("model")
            .annotate(
                requests=Count("id"),
                tokens_in=Sum("tokens_in"),
                tokens_out=Sum("tokens_out"),
                cost=Sum("cost"),
            )
            .order_by("-requests")[:25]
        )

        by_method = list(
            rows.values("method")
            .annotate(requests=Count("id"), cost=Sum("cost"))
            .order_by("-requests")
        )

        since = timezone.now() - timedelta(days=self.RECENT_DAYS)
        by_day = list(
            rows.filter(created_at__gte=since)
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(requests=Count("id"), cost=Sum("cost"))
            .order_by("day")
        )

        slots, active_index = load_slots(request)
        per_key = []
        if slots:
            described = describe_slots(slots, active_index)
            fingerprints = [fingerprint_api_key(slot["key"]) for slot in slots]
            key_totals = {
                entry["api_key_hash"]: entry
                for entry in ChatRecord.objects.filter(api_key_hash__in=fingerprints)
                .values("api_key_hash")
                .annotate(requests=Count("id"), cost=Sum("cost"))
            }
            for slot, fingerprint in zip(described, fingerprints):
                slot_totals = key_totals.get(fingerprint, {})
                per_key.append(
                    {
                        "index": slot["index"],
                        "label": slot["label"],
                        "masked": slot["masked"],
                        "provider": slot["provider"],
                        "active": slot["active"],
                        "requests": slot_totals.get("requests", 0),
                        "cost": slot_totals.get("cost"),
                    }
                )

        try:
            account = describe_account(api_key)
        except Exception as e:
            logger.info(f"Could not read the provider account: {e}")
            account = None

        if not isinstance(account, dict):
            account = None

        return Response(
            {
                "status": status.HTTP_200_OK,
                "message": "success",
                "data": {
                    "totals": totals,
                    "by_model": by_model,
                    "by_method": by_method,
                    "by_day": by_day,
                    "keys": per_key,
                    "account": account,
                    "recent_days": self.RECENT_DAYS,
                },
            },
            status=status.HTTP_200_OK,
        )
