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
from django.db.models import Q
from core.helper import (
    clear_api_key_cookie,
    encrypt_api_key,
    fingerprint_api_key,
    resolve_api_key_from_request,
    resolve_api_key_header as strip_authentication_header,
    resolve_model_from_request,
    set_api_key_cookie,
)
from core.crypto import get_public_key_payload
from core.mixins import AIServiceMixin
from core.models import ChatRecord
from ai_service import list_models, normalize_provider, test_api_key, generate_response



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
            response_data = generate_response(prompt=prompt, api_key=api_key, model=model)
            ChatRecord.objects.create(method='prompt', prompt=prompt, response=response_data, api_key=api_key)

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
        if not prompt:
            return Response(
                {"error": "A 'prompt' is required in the request body."},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            system_instruction_string = f"""
            You are a skilled explainer. Your task is to explain the given prompt in a way that is easy to understand.
            """
            response_data = generate_response(prompt=prompt, api_key=api_key, model=model, system_instruction_string=system_instruction_string)
            ChatRecord.objects.create(method='explainer', prompt=prompt, response=response_data, api_key=api_key)
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

            response_data = generate_response(prompt=prompt, api_key=api_key, model=model, system_instruction_string=system_instruction_string)
            ChatRecord.objects.create(method='code_generation', prompt=prompt, response=response_data, api_key=api_key)
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
            response_data = generate_response(prompt=prompt, api_key=api_key, model=model, system_instruction_string=system_instruction_string)
            ChatRecord.objects.create(method='code_reviewer', prompt=prompt, response=response_data, api_key=api_key)
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

            history = ChatRecord.objects.filter(
                Q(api_key_hash=fingerprint_api_key(api_key)) | Q(api_key=api_key)
            ).order_by('-created_at')

            history_list = [
                {
                    "method": record.method,
                    "prompt": record.prompt[:100],
                    "response": record.response[:100],
                    "created_at": record.created_at,
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
