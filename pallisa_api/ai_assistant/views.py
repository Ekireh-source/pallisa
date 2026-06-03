from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import StreamingHttpResponse
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .services import DatabaseAssistant
from .models import ChatMessage
import json

class ChatView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        messages = ChatMessage.objects.filter(user=request.user).order_by('created_at')
        return Response([
            {
                "id": str(msg.id),
                "role": msg.role,
                "content": msg.content,
                "timestamp": msg.created_at
            }
            for msg in messages
        ])
    
    def post(self, request):
        question = request.data.get('question')
        if not question:
            return Response({"error": "Question is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            # Save user message immediately
            ChatMessage.objects.create(user=request.user, role='user', content=question)
            
            assistant = DatabaseAssistant()
            
            def event_stream():
                full_answer = ""
                for chunk in assistant.stream(question):
                    full_answer += chunk
                    yield f"data: {json.dumps({'chunk': chunk})}\n\n"
                
                # Save assistant message after stream finishes
                if full_answer:
                    ChatMessage.objects.create(user=request.user, role='assistant', content=full_answer)
            
            response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
            response['Cache-Control'] = 'no-cache'
            return response
            
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": "An error occurred while processing the request."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
