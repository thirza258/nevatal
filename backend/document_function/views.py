"""
File and media endpoints: PDF and CSV extraction, the persisted RAG store,
meeting transcripts, and image generation.

Text-only tools live in `grammar_function`; the API key session, history, and
open-ended prompting stay in `core`.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from core.helper import (
    extract_text_from_pdf,
    resolve_api_key_header as strip_authentication_header,
)
from ai_service.gemini_service import  process_text_with_function_calling_vertex
from core.models import ChatRecord
from rag_service.rag_service import RAGIndex
from io import StringIO
import pandas as pd
from ai_service import generate_response, generate_image

class DirectExtractionView(APIView):
    """
    API endpoint to upload a PDF or CSV and ask a question about it in a single request.
    The document text is chunked and processed iteratively, with responses combined.
    """
    
    CHUNK_SIZE = 4000
    SUPPORTED_FILE_TYPES = ['pdf', 'csv']
    
    def post(self, request):
        uploaded_file = request.FILES.get("file")
        prompt = request.data.get("prompt")
        api_key = self._extract_api_key(request)

        validation_error = self._validate_request(uploaded_file, prompt)
        if validation_error:
            return validation_error

        try:
            text_content = self._extract_file_content(uploaded_file)
            
            if not text_content:
                return Response(
                    {"error": "No text could be extracted from the file."},
                    status=status.HTTP_422_UNPROCESSABLE_ENTITY
                )

            combined_response = self._process_chunks(text_content, prompt, api_key)
            
            adjusted_response = self._adjust_response(combined_response, api_key)
            self._save_chat_record(prompt, adjusted_response, api_key)
            return Response({
                "status": 200,
                "message": "success",
                "data": adjusted_response
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": f"An error occurred during processing: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _adjust_response(self, response, api_key):
        """Adjust the response to the user's request."""
        prompt = f"""
        You are helpful assistant that will adjust the response to the user's request.
        This is the result of the extraction: {response}
        Please adjust the response so there is no extra information or noise or duplicate information.
        Return the adjusted response only.
        """

        answer = generate_response(prompt=prompt, api_key=api_key)
        return answer

    def _extract_api_key(self, request):
        """Extract and clean API key from request headers."""
        api_key = request.headers.get('Authorization')
        return strip_authentication_header(api_key)

    def _validate_request(self, uploaded_file, prompt):
        """Validate that required fields are present."""
        if not uploaded_file or not prompt:
            return Response(
                {"error": "A 'file' and a 'prompt' are required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        return None

    def _extract_file_content(self, uploaded_file):
        """Extract text content from PDF or CSV file."""
        file_extension = self._get_file_extension(uploaded_file.name)
        
        if file_extension == 'pdf':
            return extract_text_from_pdf(uploaded_file)
        elif file_extension == 'csv':
            return self._extract_csv_content(uploaded_file)
        else:
            raise ValueError(f"Unsupported file type: {file_extension}")

    def _get_file_extension(self, filename):
        """Get file extension from filename."""
        return filename.split('.')[-1].lower()

    def _extract_csv_content(self, csv_file):
        """Extract and convert CSV to string format."""
        try:
            df = pd.read_csv(csv_file)
            
            df = self._clean_dataframe(df)
            
            text_content = self._dataframe_to_text(df)
            
            return text_content
        except Exception as e:
            raise ValueError(f"Error processing CSV file: {str(e)}")

    def _clean_dataframe(self, df):
        """Clean DataFrame by handling missing values and formatting."""
        df = df.dropna(how='all', axis=0)
        df = df.dropna(how='all', axis=1)
        
        df = df.fillna('')
        
        for col in df.select_dtypes(include=['object']).columns:
            df[col] = df[col].astype(str).str.strip()
        
        return df

    def _dataframe_to_text(self, df):
        """Convert DataFrame to a readable text format."""
        buffer = StringIO()
        
        buffer.write(f"Total Rows: {len(df)}\n")
        buffer.write(f"Total Columns: {len(df.columns)}\n\n")
        
        buffer.write("Columns: " + ", ".join(df.columns.tolist()) + "\n\n")
        
        buffer.write("Data:\n")
        buffer.write(df.to_string(index=False))
        
        return buffer.getvalue()

    def _process_chunks(self, text_content, prompt, api_key):
        """Process text content in chunks and combine responses."""
        chunks = self._create_chunks(text_content)
        combined_response = ""
        
        for idx, chunk in enumerate(chunks):
            chunk_response = self._process_single_chunk(
                chunk, idx, len(chunks), prompt, api_key
            )
            combined_response = self._combine_responses(
                combined_response, chunk_response, idx
            )
        
        return combined_response

    def _create_chunks(self, text_content):
        """Split text content into chunks."""
        return [
            text_content[i:i + self.CHUNK_SIZE] 
            for i in range(0, len(text_content), self.CHUNK_SIZE)
        ]

    def _process_single_chunk(self, chunk, chunk_index, total_chunks, prompt, api_key):
        """Process a single chunk and return the response."""
        chunk_prompt = self._build_chunk_prompt(
            chunk, chunk_index, total_chunks, prompt
        )
        
        system_instruction = (
            "You are a helpful assistant that extracts data and puts it "
            "in a structured format based on user prompt."
        )
        
        answer = generate_response(
            prompt=chunk_prompt,
            api_key=api_key,
            system_instruction_string=system_instruction
        )
        
        
        return answer

    def _build_chunk_prompt(self, chunk, chunk_index, total_chunks, user_prompt):
        """Build the prompt for a specific chunk."""
        return f"""
            Document chunk {chunk_index + 1} of {total_chunks}:

            {chunk}

            User request: {user_prompt}

            Please extract the relevant data from this chunk according to the user's request.
            """

    def _combine_responses(self, combined_response, new_response, chunk_index):
        """Combine multiple chunk responses into a single response."""
        if combined_response:
            combined_response += "\n\n---\n\n"
        combined_response += f"Chunk {chunk_index + 1}:\n{new_response}"
        return combined_response

    def _save_chat_record(self, prompt, response, api_key):
        """Save chat record to database."""
        ChatRecord.objects.create(
            method='direct_extraction',
            prompt=prompt,
            response=response,
            api_key=api_key
        )

class AnalyzeTextView(APIView):
    """
    This is function calling gemini api to analyze the text and return the analysis.
    """

    def post(self, request):
        text = request.data.get("text")
        api_key = request.headers.get("Authorization")
        api_key = strip_authentication_header(api_key)
        if not text:
            return Response(
                {"error": "A 'text' is required in the request body."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not api_key:
            return Response(
                {"error": "Authorization header is required."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            response = process_text_with_function_calling_vertex(prompt=text, api_key=api_key)
            ChatRecord.objects.create(method='analyze_text', prompt=text, response=response, api_key=api_key)
            return Response({
                "status": 200,
                "message": "success",
                "data": response
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"An error occurred during processing: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ----------------------------------------------------------------------
# Document AI (persisted RAG)
# ----------------------------------------------------------------------

class PDFUploadRAGView(APIView):
    """
    API endpoint to upload a PDF, extract its text,
    and persist its index through the RAG service.

    Each upload gets its own numbered folder under MEDIA_ROOT (1/, 2/, 3/ ...),
    so earlier documents stay searchable instead of being wiped by the next
    upload, and their embeddings survive a restart.
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
            # The PDF is stored inside the folder it was indexed into, so the
            # source and the vectors built from it cannot drift apart.
            document = rag_index.add_document(
                pdf_file.name, text_content, source_file=pdf_file
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to index the document: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response({
            "message": "PDF processed successfully",
            "file_path": document.get("file_path"),
            "document_name": pdf_file.name,
            "document_id": document.get("document_id"),
            "chunk_count": document.get("chunk_count"),
            "documents": rag_index.list_documents(),
        }, status=status.HTTP_200_OK)

class RAGChatView(APIView):
    """
    API View for chatting with the RAG service.

    Answers draw on every document persisted for this API key. Pass
    `document_ids` to narrow the search to particular folders.
    """

    def post(self, request, *args, **kwargs):
        """
        Handles POST requests to chat with the RAG service.
        """
        prompt = request.data.get("prompt")
        document_ids = request.data.get("document_ids")
        api_key = request.headers.get('Authorization')
        api_key = strip_authentication_header(api_key)
        if not prompt:
            return Response(
                {"error": "A 'prompt' is required in the request body."},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            rag_index = RAGIndex(api_key=api_key)
            chunks = rag_index.retrieve_chunks(prompt, k=3, document_ids=document_ids)

            if not chunks:
                return Response(
                    {"error": "No indexed documents yet. Upload a PDF before asking questions."},
                    status=status.HTTP_422_UNPROCESSABLE_ENTITY
                )

            augmented_prompt = (
                f"User Question: {prompt}\n"
                "Context Information:\n"
                + "\n".join(
                    f"Document {i+1} ({chunk['source']}): {chunk['text']}"
                    for i, chunk in enumerate(chunks)
                )
            )

            system_instruction_string = f"""
            You are a helpful assistant. Your task is to answer the user's question based on the given context.
            """
            response_data = generate_response(prompt=augmented_prompt, api_key=api_key, system_instruction_string=system_instruction_string)
            # Record the question, not the context blob built around it.
            ChatRecord.objects.create(method='rag_chat', prompt=prompt, response=response_data, api_key=api_key)
            return Response({
                "status": 200,
                "message": "success",
                "data": response_data,
                "sources": [
                    {"document_id": document_id, "source": source}
                    for document_id, source in dict.fromkeys(
                        (chunk["document_id"], chunk["source"]) for chunk in chunks
                    )
                ],
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "status": 500,
                "message": "error",
                "data": "An unexpected error occurred while processing your request." + str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RAGDocumentsView(APIView):
    """
    API View for listing and removing the persisted RAG documents.

    Reads meta.json rather than the pkl files, so listing never has to
    unpickle the embeddings.
    """

    def get(self, request):
        api_key = strip_authentication_header(request.headers.get('Authorization'))
        if not api_key:
            return Response(
                {"error": "Authorization header is required."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            documents = RAGIndex(api_key=api_key).list_documents()
        except Exception as e:
            return Response({
                "status": 500,
                "message": "error",
                "data": "An unexpected error occurred while processing your request." + str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            "status": 200,
            "message": "success",
            "data": documents,
        }, status=status.HTTP_200_OK)

    def delete(self, request, document_id=None):
        api_key = strip_authentication_header(request.headers.get('Authorization'))
        if not api_key:
            return Response(
                {"error": "Authorization header is required."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            rag_index = RAGIndex(api_key=api_key)

            if document_id is None:
                removed = rag_index.delete_all_documents()
            elif rag_index.delete_document(document_id):
                removed = 1
            else:
                return Response(
                    {"error": f"Document {document_id} was not found."},
                    status=status.HTTP_404_NOT_FOUND
                )
        except Exception as e:
            return Response({
                "status": 500,
                "message": "error",
                "data": "An unexpected error occurred while processing your request." + str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            "status": 200,
            "message": "success",
            "data": {"removed": removed, "documents": rag_index.list_documents()},
        }, status=status.HTTP_200_OK)


# ----------------------------------------------------------------------
# Transcripts & media
# ----------------------------------------------------------------------

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
