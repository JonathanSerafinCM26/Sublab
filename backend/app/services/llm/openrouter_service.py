from openai import AsyncOpenAI
from typing import Optional, AsyncGenerator
import os

from app.core.config import settings


class OpenRouterService:
    """LLM service using OpenRouter API (OpenAI compatible)."""
    
    COACH_SYSTEM_PROMPT = """Eres un coach de bienestar mental especializado en mindfulness y manejo de la ansiedad.

Tu personalidad:
- Empático y comprensivo
- Profesional pero cercano
- Enfocado en técnicas prácticas
- Usas un lenguaje natural y cálido

Directrices:
- Responde en español
- Mantén respuestas concisas (2-3 párrafos máximo)
- Ofrece técnicas prácticas cuando sea apropiado
- Nunca des diagnósticos médicos
- Si detectas una crisis, recomienda buscar ayuda profesional

Eres el compañero de bienestar del usuario, aquí para ayudarle a encontrar calma y claridad."""
    
    def __init__(self):
        self._client: Optional[AsyncOpenAI] = None
        self._model = "google/gemma-2-9b-it:free"  # Free tier model that works
    
    @property
    def is_configured(self) -> bool:
        return bool(settings.openrouter_api_key)
    
    def _get_client(self) -> AsyncOpenAI:
        if self._client is None:
            self._client = AsyncOpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=settings.openrouter_api_key,
                default_headers={
                    "HTTP-Referer": "https://sublab.app",
                    "X-Title": "SubLab MVP"
                }
            )
        return self._client
    
    async def get_response(
        self,
        user_message: str,
        conversation_history: Optional[list[dict]] = None
    ) -> str:
        """Get a response from the coach LLM.
        
        Args:
            user_message: The user's message
            conversation_history: Optional list of previous messages
            
        Returns:
            The coach's response text
        """
        if not self.is_configured:
            raise RuntimeError("OpenRouter API key not configured")
        
        client = self._get_client()
        
        messages = [
            {"role": "system", "content": self.COACH_SYSTEM_PROMPT}
        ]
        
        if conversation_history:
            messages.extend(conversation_history)
        
        messages.append({"role": "user", "content": user_message})
        
        try:
            completion = await client.chat.completions.create(
                model=self._model,
                messages=messages,
                max_tokens=500,
                temperature=0.7
            )
            
            return completion.choices[0].message.content
            
        except Exception as e:
            print(f"❌ OpenRouter error: {e}")
            # Fallback response
            return "Entiendo cómo te sientes. ¿Podrías contarme un poco más sobre lo que estás experimentando?"
    
    async def get_response_stream(
        self,
        user_message: str,
        conversation_history: Optional[list[dict]] = None
    ) -> AsyncGenerator[str, None]:
        """Get a streaming response from the coach LLM.
        
        Args:
            user_message: The user's message
            conversation_history: Optional list of previous messages
            
        Yields:
            Text chunks from the response
        """
        if not self.is_configured:
            raise RuntimeError("OpenRouter API key not configured")
        
        client = self._get_client()
        
        messages = [
            {"role": "system", "content": self.COACH_SYSTEM_PROMPT}
        ]
        
        if conversation_history:
            messages.extend(conversation_history)
        
        messages.append({"role": "user", "content": user_message})
        
        try:
            stream = await client.chat.completions.create(
                model=self._model,
                messages=messages,
                max_tokens=500,
                temperature=0.7,
                stream=True
            )
            
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            print(f"❌ OpenRouter stream error: {e}")
            yield "Entiendo cómo te sientes. ¿Podrías contarme un poco más?"


# Global singleton instance
llm_service = OpenRouterService()
