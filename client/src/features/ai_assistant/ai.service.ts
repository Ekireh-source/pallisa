import api from '@/lib/api';

export const AskAiAssistant = async (question: string): Promise<{ answer: string } | { error: string }> => {
  // Legacy non-streaming method
  try {
    const response = await api.post('/ai-assistant/chat/', { question });
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error) {
      return { error: error.response.data.error };
    }
    return { error: 'Failed to connect to AI Assistant. Please try again later.' };
  }
};

export const StreamAiAssistant = async (
  question: string,
  onChunk: (chunk: string) => void,
  onError: (error: string) => void,
  onComplete: () => void
) => {
  try {
    // We use native fetch because Axios doesn't support true streaming out of the box in the browser easily
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/ai-assistant/chat/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Extremely important: sends the HttpOnly JWT cookies
      body: JSON.stringify({ question })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      onError(errData.error || `HTTP error! status: ${response.status}`);
      return;
    }

    if (!response.body) {
      onError('Response body is missing');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const dataStr = line.slice(6);
            if (dataStr.trim() === '') continue;
            
            const data = JSON.parse(dataStr);
            if (data.chunk) {
              onChunk(data.chunk);
            }
          } catch (e) {
            console.error('Failed to parse stream chunk', e, line);
          }
        }
      }
    }
    
    onComplete();
  } catch (error: any) {
    onError(error.message || 'Failed to stream response');
  }
};

export const FetchAiHistory = async (): Promise<any[]> => {
  try {
    const response = await api.get('/ai-assistant/chat/');
    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch AI chat history', error);
    return [];
  }
};
