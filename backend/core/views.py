from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import json
import logging
from django.conf import settings
from django.db.models import Q
from core.helper import (
    clear_api_key_cookie,
    encrypt_api_key,
    extract_text_from_pdf,
    fingerprint_api_key,
    resolve_api_key_header as strip_authentication_header,
    save_file,
    set_api_key_cookie,
)
from core.models import ChatRecord
from rag_service.rag_service import RAGIndex
from ai_service import normalize_provider, test_api_key, generate_response, generate_image



logger = logging.getLogger(__name__)


class AIServiceMixin:
    """
    Compatibility helpers for tests and internal reuse.
    """

    default_provider = "gemini"

    def _default_api_key(self):
        return getattr(settings, "GEMINI_API_KEY", "")

    def generate_response(self, *args, **kwargs):
        kwargs.setdefault("api_key", self._default_api_key())
        kwargs.setdefault("provider", self.default_provider)
        kwargs.setdefault(
            "system_instruction_string",
            getattr(self, "default_system_instruction_string", "Answer this prompt make sure answer that"),
        )
        response = generate_response(*args, **kwargs)
        try:
            parsed = json.loads(response)
        except (TypeError, ValueError):
            return response

        if isinstance(parsed, dict) and set(parsed.keys()) == {"response"}:
            return parsed["response"]

        return response

    def test_api_key(self, *args, **kwargs):
        kwargs.setdefault("api_key", self._default_api_key())
        kwargs.setdefault("provider", self.default_provider)
        return test_api_key(*args, **kwargs)

    def generate_image(self, *args, **kwargs):
        kwargs.setdefault("api_key", self._default_api_key())
        kwargs.setdefault("provider", self.default_provider)
        return generate_image(*args, **kwargs)

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
            response_data = generate_response(prompt=prompt, api_key=api_key)
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
        if not prompt:
            return Response(
                {"error": "A 'prompt' is required in the request body."},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            system_instruction_string = f"""
            You are a skilled explainer. Your task is to explain the given prompt in a way that is easy to understand.
            """
            response_data = generate_response(prompt=prompt, api_key=api_key, system_instruction_string=system_instruction_string)
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

class PDFUploadRAGView(APIView):
    """
    API endpoint to upload a PDF, extract its text,
    and process it through the RAG service.
    """

    def post(self, request):
        pdf_file = request.FILES.get("file")

        if not pdf_file:
            return Response(
                {"error": "No PDF file provided."},
                status=status.HTTP_400_BAD_REQUEST
            )

        api_key = strip_authentication_header(request.headers.get('Authorization'))
        if not api_key:
            return Response(
                {"error": "Authorization header is required."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            file_path = save_file(pdf_file)
        except Exception as e:
            return Response(
                {"error": f"Failed to save PDF: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Check the extraction before indexing: passing None to add_document
        # raised a TypeError that surfaced as a confusing 500 instead of this.
        text_content = extract_text_from_pdf(pdf_file)
        if not text_content:
            return Response(
                {"error": "No text could be extracted from this PDF. Scanned or image-only files are not supported."},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )

        try:
            rag_index = RAGIndex(api_key=api_key)
            rag_index.delete_all_chunks()
            rag_index.add_document(pdf_file.name, text_content)
        except Exception as e:
            return Response(
                {"error": f"Failed to index the document: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response({
            "message": "PDF processed successfully",
            "file_path": file_path,
            "document_name": pdf_file.name,
        }, status=status.HTTP_200_OK)

class RAGChatView(APIView):
    """
    API View for chatting with the RAG service.
    """

    def post(self, request, *args, **kwargs):
        """
        Handles POST requests to chat with the RAG service.
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
            rag_index = RAGIndex(api_key=api_key)
            chunks = rag_index.retrieve_documents(prompt, k=3)
            
            prompt = (
                f"User Question: {prompt}\n"        
                "Context Information:\n"
                + "\n".join(f"Document {i+1}: {chunk}" for i, chunk in enumerate(chunks))
            )

            system_instruction_string = f"""
            You are a helpful assistant. Your task is to answer the user's question based on the given context.
            """
            response_data = generate_response(prompt=prompt, api_key=api_key, system_instruction_string=system_instruction_string)
            ChatRecord.objects.create(method='rag_chat', prompt=prompt, response=response_data, api_key=api_key)
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
       
class ImageGeneratorView(APIView):
    """
    API View for generating an image from a text prompt using the Gemini API.
    """

    def post(self, request, *args, **kwargs):
        """
        Handles POST requests to generate an image.
        """
        prompt = request.data.get("prompt")
        api_key = request.headers.get("Authorization")
        api_key = strip_authentication_header(api_key)

        if not prompt:
            return Response(
                {"error": "A 'prompt' is required in the request body."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not api_key:
            return Response(
                {"error": "Authorization header is required."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            image_info = generate_image(prompt=prompt, api_key=api_key)
            ChatRecord.objects.create(
                method="image_generation",
                prompt=prompt,
                response=f"[Image generated: {image_info['extension']}]",
                api_key=api_key
            )

            return Response(
                {
                    "status": 200,
                    "message": "success",
                    "data": {
                        "mime_type": image_info["mime_type"],
                        "extension": image_info["extension"],
                        "image_base64": image_info["base64_image"],
                    },
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            if isinstance(e, NotImplementedError):
                return Response(
                    {"error": str(e)},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return Response(
                {"error": f"An unexpected error occurred while processing your request. {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
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

class CodeGeneratorView(APIView):
    """
    API View for generating code from a text prompt using the Gemini API.
    """
    def post(self, request, *args, **kwargs):
        """
        Handles POST requests to generate code.
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
            You are a skilled code generator. Your task is to generate code from a text prompt.
            The code should be generated based on the following prompt:
            """

            response_data = generate_response(prompt=prompt, api_key=api_key, system_instruction_string=system_instruction_string)
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
    """
    def post(self, request, *args, **kwargs):
        """
        Handles POST requests to review code.
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
            You are a skilled code reviewer. Your task is to review the code and provide feedback.
            The code should be reviewed based on the following prompt:
            {prompt}
            """
            response_data = generate_response(prompt=prompt, api_key=api_key, system_instruction_string=system_instruction_string)
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

class MeetingSummaryView(APIView):
    """
    API View for summarizing a meeting from a text prompt using the Gemini API.
    """
    def post(self, request, *args, **kwargs):
        """
        Handles POST requests to summarize a meeting.
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
            You are a skilled meeting summarizer. Your task is to summarize a meeting from a text prompt.
            The meeting should be summarized based on the following prompt:
            {prompt}
            """
            response_data = generate_response(prompt=prompt, api_key=api_key, system_instruction_string=system_instruction_string)
            ChatRecord.objects.create(method='meeting_summary', prompt=prompt, response=response_data, api_key=api_key)
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
            
