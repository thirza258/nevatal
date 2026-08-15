"""
Text endpoints: writing, editing, language, and the business copy tools.

Everything here takes text the user supplies and hands back text. Files and
media are handled by `document_function`; the API key session, history, and
open-ended prompting stay in `core`.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from core.helper import resolve_api_key_header as strip_authentication_header
from core.mixins import AIServiceMixin
from core.models import ChatRecord
from ai_service import generate_response


# ----------------------------------------------------------------------
# Write & edit
# ----------------------------------------------------------------------

class WriterView(APIView):
    """
    API View for creating original and engaging text.
    This view now leverages robust error handling and a consistent response structure.
    """

    def post(self, request, *args, **kwargs):
        """
        Handles POST requests to generate written text.

        This method is responsible for request handling, validation, and
        returning a consistent API response format.
        """
        prompt = request.data.get("prompt")
        api_key = request.headers.get('Authorization')
        api_key = strip_authentication_header(api_key)

        if not prompt:

            return Response(
                {"error": "A 'prompt' is required in the request body."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            system_instruction_string = f"""You are an expert writer. Your goal is to create original, engaging, and high-quality text based on the user's prompt."""
            response_data = generate_response(prompt=prompt, api_key=api_key, system_instruction_string=system_instruction_string)
            ChatRecord.objects.create(method='writer', prompt=prompt, response=response_data, api_key=api_key)

            return Response({
                "status": 200,
                "message": "success",
                "data": response_data
            }, status=status.HTTP_200_OK)
        except Exception as e:

            return Response(
                {"error": "An unexpected error occurred while processing your request."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class RewriterView(APIView):
    """
    API View for improving content with alternative options.
    This view now leverages robust error handling and a consistent response structure.
    """

    def post(self, request, *args, **kwargs):
        """
        Handles POST requests to generate rewritten text.

        This method is responsible for request handling, validation, and
        returning a consistent API response format.
        """
        prompt = request.data.get("prompt")
        api_key = request.headers.get('Authorization')
        api_key = strip_authentication_header(api_key)

        if not prompt:

            return Response(
                {"error": "A 'prompt' is required in the request body."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            system_instruction_string = f"""You are a skilled rewriter. Your task is to rewrite the given text in a way that is more engaging and persuasive."""
            response_data = generate_response(prompt=prompt, api_key=api_key, system_instruction_string=system_instruction_string)
            ChatRecord.objects.create(method='rewriter', prompt=prompt, response=response_data, api_key=api_key)

            return Response({
                "status": 200,
                "message": "success",
                "data": response_data
            }, status=status.HTTP_200_OK)
        except Exception as e:

            return Response(
                {"error": "An unexpected error occurred while processing your request."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ProofreaderView(APIView):
    def post(self, request, *args, **kwargs):
        prompt = request.data.get("prompt")
        api_key = request.headers.get('Authorization')
        api_key = strip_authentication_header(api_key)
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
            system_instruction_string = f"""You are a proofreader.
                     Your task is to proofread the given text and
                     make sure it is grammatically correct and semantically correct.
                     And make sure to proofread eventough the text is already perfect
                     """

            response_data = generate_response(prompt=prompt, api_key=api_key, system_instruction_string=system_instruction_string)
            ChatRecord.objects.create(method='proofreader', prompt=prompt, response=response_data, api_key=api_key)
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

class SummarizerView(AIServiceMixin, APIView):
    """
    API View for summarizing complex information into clear insights.
    This view now leverages the robust error handling and response structure
    from the PromptView class.
    """
    default_system_instruction_string = (
        "You are a highly skilled summarizer. Your task is to distill complex "
        "information into clear and concise insights."
    )

    def post(self, request, *args, **kwargs):
        """
        Handles POST requests to generate a summary from a prompt.

        This method is responsible for request handling, validation, and
        returning a consistent API response format.
        """
        prompt = request.data.get("prompt")
        api_key = strip_authentication_header(request.headers.get('Authorization')) or self._default_api_key()
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
            system_instruction_string = f"""You are a highly skilled summarizer. Your task is to distill complex information into clear and concise insights."""

            response_data = generate_response(prompt=prompt, api_key=api_key, system_instruction_string=system_instruction_string)
            ChatRecord.objects.create(method='summarizer', prompt=prompt, response=response_data, api_key=api_key)

            return Response({
                "status": 200,
                "message": "success",
                "data": response_data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": "An unexpected error occurred while processing your request."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ----------------------------------------------------------------------
# Language & analysis
# ----------------------------------------------------------------------

class TranslatorView(APIView):

    def post(self, request, *args, **kwargs):
        """
        Handles POST requests to translate text.

        Validates input, calls the translation logic, and returns a standardized API response.
        """
        prompt = request.data.get("prompt")
        target_language = request.data.get("target_language", "English")
        source_language = request.data.get("source_language", "English")
        api_key = request.headers.get('Authorization')
        api_key = strip_authentication_header(api_key)

        if not prompt:
            return Response(
                {"error": "Prompt is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            system_instruction_string = f"""You are a professional translator. Translate the given text into {target_language} from {source_language}."""
            translation_text = generate_response(api_key=api_key, prompt=prompt, system_instruction_string=system_instruction_string)
            ChatRecord.objects.create(method='translator', prompt=prompt, response=translation_text, api_key=api_key)

            return Response({
                "status": 200,
                "message": "success",
                "data": translation_text
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": "An unexpected error occurred while processing your request."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class SentimentAnalyzerView(APIView):
    """
    API View for analyzing the sentiment of a text prompt using the Gemini API.
    """
    def post(self, request, *args, **kwargs):
        """
        Handles POST requests to analyze the sentiment of a text prompt.
        """
        prompt = request.data.get("prompt")
        api_key = request.headers.get("Authorization")
        api_key = strip_authentication_header(api_key)
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
            You are a skilled sentiment analyzer. Your task is to analyze the sentiment of a text prompt.
            The sentiment should be analyzed based on the following prompt:
            {prompt}
            """
            response_data = generate_response(prompt=prompt, api_key=api_key, system_instruction_string=system_instruction_string)
            ChatRecord.objects.create(method='sentiment_analysis', prompt=prompt, response=response_data, api_key=api_key)
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


# ----------------------------------------------------------------------
# Business
# ----------------------------------------------------------------------

class CopyWritingView(APIView):
    """
    API View for generating copywriting based on the prompt.
    """

    def post(self, request, *args, **kwargs):
        """
        Handles POST requests to generate copywriting.
        """
        prompt = request.data.get("prompt")
        api_key = request.headers.get('Authorization')
        api_key = strip_authentication_header(api_key)
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
            You are a skilled copywriter. Your task is to create engaging and persuasive copywriting based on the user's prompt.
            """
            response_data = generate_response(prompt=prompt, api_key=api_key, system_instruction_string=system_instruction_string)
            ChatRecord.objects.create(method='copywriting', prompt=prompt, response=response_data, api_key=api_key)
            return Response({
                "status": 200,
                "message": "success",
                "data": response_data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": "An unexpected error occurred while processing your request."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class EmailGeneratorView(APIView):
    """
    API View for generating an email from a text prompt using the Gemini API.
    """

    def post(self, request, *args, **kwargs):
        """
        Handles POST requests to generate an email.
        """
        context = request.data.get("context")
        recipients = request.data.get("recipients")
        sender = request.data.get("sender")
        prompt = request.data.get("prompt")

        api_key = request.headers.get("Authorization")
        api_key = strip_authentication_header(api_key)

        # Validate before building the composed prompt — the old order
        # overwrote `prompt` first, so these checks could never fail.
        for field_name, value in (
            ("context", context),
            ("recipients", recipients),
            ("sender", sender),
            ("prompt", prompt),
        ):
            if not value:
                return Response(
                    {"error": f"A '{field_name}' is required in the request body."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        prompt = f"""
            You are a skilled email generator. Your task is to generate an email from a text prompt.
            The email should be generated based on the following context:
            {context}
            The recipients of the email are:
            {recipients}
            The sender of the email is:
            {sender}
            The email should be generated based on the following prompt:
            {prompt}
        """

        system_instruction_string = f"""
        You are a skilled email generator. Your task is to generate an email from a text prompt.
        """
        try:
            response_data = generate_response(prompt=prompt, api_key=api_key, system_instruction_string=system_instruction_string)
            ChatRecord.objects.create(method='email_generation', prompt=prompt, response=response_data, api_key=api_key)
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

class SocialMediaPostGeneratorView(APIView):
    """
    API View for generating a social media post from a text prompt using the Gemini API.
    """
    def post(self, request, *args, **kwargs):
        """
        Handles POST requests to generate a social media post.
        """
        prompt = request.data.get("prompt")

        platform = request.data.get("platform")
        tone = request.data.get("tone")
        audience = request.data.get("audience")

        hashtag_count = request.data.get("hashtag_count")
        include_emojis = request.data.get("include_emojis")
        include_cta = request.data.get("include_cta")
        post_length = request.data.get("post_length")

        brand_name = request.data.get("brand_name")
        brand_keywords = request.data.get("brand_keywords")

        api_key = request.headers.get("Authorization")
        api_key = strip_authentication_header(api_key)
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
            prompt = f"""
            Prompt:{prompt}
            Platform: {platform}
            Tone: {tone}
            Audience: {audience}
            Hashtag Count: {hashtag_count}
            Include Emojis: {include_emojis}
            Include CTA: {include_cta}
            Post Length: {post_length}
            Brand Name: {brand_name}
            Brand Keywords: {brand_keywords}
            """

            system_instruction_string = f"""
            You are a skilled social media post generator. Your task is to generate a social media post from a platform, tone, audience, hashtag count, include emojis, include cta, post length, brand name, and brand keywords.
            """

            response_data = generate_response(prompt=prompt, api_key=api_key, system_instruction_string=system_instruction_string)
            ChatRecord.objects.create(method='social_media_post_generation', prompt=prompt, response=response_data, api_key=api_key)
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
