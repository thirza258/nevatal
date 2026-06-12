import base64
import logging
import mimetypes
from typing import Optional

from google import genai
from google.genai import types

from .ai_service import BaseAIService, get_ai_service, normalize_provider, PROVIDER_GEMINI

logger = logging.getLogger(__name__)


class GeminiService(BaseAIService):
    provider_name = PROVIDER_GEMINI
    default_model = "gemini-2.5-flash-lite"

    def test_api_key(self, api_key: Optional[str] = None) -> str:
        key = self.resolve_api_key(api_key)
        client = genai.Client(api_key=key)
        response = client.models.generate_content(
            model=self.default_model,
            contents="test",
        )
        return self.coerce_text(response)

    def generate_response(
        self,
        prompt: str,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        system_instruction_string: str = "Answer this prompt make sure answer that",
        response_schema_param: Optional[list[str]] = None,
        response_mime_type_param: str = "application/json",
    ) -> str:
        try:
            key = self.resolve_api_key(api_key)
            model_name = self.normalize_model(model)
            schema_fields = response_schema_param or ["response"]

            response_schema_properties = {
                param: genai.types.Schema(
                    type=genai.types.Type.STRING,
                )
                for param in schema_fields
            }

            client = genai.Client(api_key=key)
            contents = [
                genai.types.Content(
                    role="user",
                    parts=[
                        genai.types.Part.from_text(text=prompt),
                    ],
                ),
            ]

            config_kwargs = {
                "thinking_config": genai.types.ThinkingConfig(
                    thinking_budget=-1,
                ),
                "response_mime_type": response_mime_type_param,
                "system_instruction": [
                    genai.types.Part.from_text(text=system_instruction_string),
                ],
            }

            if schema_fields:
                config_kwargs["response_schema"] = genai.types.Schema(
                    type=genai.types.Type.OBJECT,
                    required=schema_fields,
                    properties=response_schema_properties,
                )

            generate_content_config = genai.types.GenerateContentConfig(**config_kwargs)

            response = client.models.generate_content(
                model=model_name,
                contents=contents,
                config=generate_content_config,
            )

            response_text = self.coerce_text(response)
            return self.ensure_json_response(response_text, schema_fields)
        except Exception as e:
            logger.error(f"An error occurred during Gemini API call: {e}")
            raise

    def generate_image(self, prompt: str, api_key: Optional[str] = None):
        key = self.resolve_api_key(api_key)
        client = genai.Client(api_key=key)
        model = "gemini-2.5-flash-image"

        contents = [
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=prompt)],
            )
        ]

        generate_content_config = types.GenerateContentConfig(
            response_modalities=["IMAGE", "TEXT"],
        )

        for chunk in client.models.generate_content_stream(
            model=model,
            contents=contents,
            config=generate_content_config,
        ):
            if (
                chunk.candidates
                and chunk.candidates[0].content
                and chunk.candidates[0].content.parts
            ):
                part = chunk.candidates[0].content.parts[0]
                if hasattr(part, "inline_data") and part.inline_data and part.inline_data.data:
                    mime_type = part.inline_data.mime_type
                    image_data = part.inline_data.data
                    base64_str = base64.b64encode(image_data).decode("utf-8")
                    extension = mimetypes.guess_extension(mime_type) or ".png"
                    return {
                        "mime_type": mime_type,
                        "extension": extension,
                        "base64_image": base64_str,
                    }

        raise Exception("No image data returned from Gemini API.")


def classify_text(category: str):
    """Classifies the text into a given category."""
    return {
        "status": "success",
        "classification_result": f"The text has been classified under the category: {category}",
    }


def analyze_sentiment(sentiment: str, score: float):
    """Analyzes the sentiment of the text."""
    return {
        "status": "success",
        "sentiment_analysis": {"sentiment": sentiment, "confidence_score": score},
    }


def determine_topic(topic: str, keywords: list[str]):
    """Determines the main topic of the text and extracts key words."""
    return {
        "status": "success",
        "topic_analysis": {"main_topic": topic, "keywords": keywords},
    }


def process_text_with_function_calling_vertex(prompt: str, api_key: str):
    """
    Orchestrates the multi-turn conversation with Gemini for function calling.
    """
    client = genai.Client(api_key=api_key)

    tools = [
        types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name="classify_text",
                    description="Use this function to classify text into a specific category like Technology, Finance, or Health.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "category": types.Schema(
                                type=types.Type.STRING,
                                description="The category to classify the text into.",
                                enum=["Technology", "Finance", "Health", "General"],
                            )
                        },
                        required=["category"],
                    ),
                ),
                types.FunctionDeclaration(
                    name="analyze_sentiment",
                    description="Use this function to analyze the sentiment of a piece of text.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "sentiment": types.Schema(
                                type=types.Type.STRING,
                                description="The sentiment of the text.",
                                enum=["Positive", "Negative", "Neutral"],
                            ),
                            "score": types.Schema(
                                type=types.Type.NUMBER,
                                description="The confidence score of the sentiment analysis, from 0.0 to 1.0.",
                            ),
                        },
                        required=["sentiment", "score"],
                    ),
                ),
                types.FunctionDeclaration(
                    name="determine_topic",
                    description="Use this function to find the main topic and important keywords in a text.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "topic": types.Schema(
                                type=types.Type.STRING,
                                description="The primary topic of the text.",
                            ),
                            "keywords": types.Schema(
                                type=types.Type.ARRAY,
                                items=types.Schema(type=types.Type.STRING),
                                description="A list of 2-3 main keywords from the text.",
                            ),
                        },
                        required=["topic", "keywords"],
                    ),
                ),
            ]
        )
    ]

    available_functions = {
        "classify_text": classify_text,
        "analyze_sentiment": analyze_sentiment,
        "determine_topic": determine_topic,
    }

    model_name = "gemini-2.5-flash-lite"
    contents = [types.Content(role="user", parts=[types.Part.from_text(text=prompt)])]
    config = types.GenerateContentConfig(tools=tools)

    response = client.models.generate_content(
        model=model_name,
        contents=contents,
        config=config,
    )

    if response.candidates and response.candidates[0].content:
        tool_calls = getattr(response.candidates[0].content, "parts", [])
        for part in tool_calls:
            function_call = getattr(part, "function_call", None)
            if function_call and function_call.name in available_functions:
                function_name = function_call.name
                function_args = dict(function_call.args or {})
                function_result = available_functions[function_name](**function_args)

                follow_up_response = client.models.generate_content(
                    model=model_name,
                    contents=[
                        types.Content(
                            role="user",
                            parts=[
                                types.Part.from_text(text=prompt),
                            ],
                        ),
                        types.Content(
                            role="tool",
                            parts=[
                                types.Part.from_text(text=str(function_result)),
                            ],
                        ),
                    ],
                    config=config,
                )
                return follow_up_response.text or str(function_result)

    return response.text or ""


def _resolve_service(api_key: Optional[str], provider: Optional[str] = None):
    return get_ai_service(provider=provider, api_key=api_key)


def test_api_key(api_key: str, provider: Optional[str] = None):
    try:
        service = _resolve_service(api_key, provider)
        return service.test_api_key(api_key)
    except Exception as e:
        logger.error(f"API key validation failed: {e}")
        return False


def generate_response(
    api_key: str,
    prompt: str,
    model: str = "gemini-2.5-flash-lite",
    system_instruction_string: str = "Answer this prompt make sure answer that",
    response_schema_param: Optional[list[str]] = None,
    response_mime_type_param: str = "application/json",
    provider: Optional[str] = None,
) -> str:
    service = _resolve_service(api_key, provider)
    schema_fields = response_schema_param or ["response"]
    return service.generate_response(
        prompt=prompt,
        api_key=api_key,
        model=model,
        system_instruction_string=system_instruction_string,
        response_schema_param=schema_fields,
        response_mime_type_param=response_mime_type_param,
    )


def generate_image(prompt: str, api_key: str, provider: Optional[str] = None):
    service = _resolve_service(api_key, provider)
    return service.generate_image(prompt=prompt, api_key=api_key)
