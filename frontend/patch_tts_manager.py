import re

with open('d:/Ruben/Sublab/backend/app/services/tts/tts_manager.py', 'r', encoding='utf-8') as f:
    text = f.read()

# Remove xtts import
text = re.sub(r"from app\.services\.tts\.xtts_service import xtts_service\n", "", text)

# Replace get_status
status_new = """    def get_status(self) -> Dict[str, Any]:
        \"\"\"Get status of all TTS providers.\"\"\"
        return {
            "fish_audio": {
                "configured": fish_service.is_configured,
                "is_default": True,
                "provider": "fish_audio"
            },
            "default_voice_id": self._default_voice_id,
            "last_provider_used": self._active_provider
        }"""
text = re.sub(
    r"    def get_status\(self\).*?\n        \}",
    status_new,
    text,
    flags=re.DOTALL
)

# Replace generate_audio logic
generate_new = """        # Strategy 1: Try Fish Audio first (default)
        if fish_service.is_configured:
            try:
                print(f"í°Ÿ Trying Fish Audio (voice: {effective_voice_id or 'default'})...")
                audio = await fish_service.generate_audio(text, effective_voice_id)
                self._active_provider = "fish_audio"
                print(f"âœ… Fish Audio success! ({len(audio)} bytes)")
                return audio, "fish_audio"
            except Exception as e:
                print(f"âŒ Fish Audio failed: {e}")
                raise RuntimeError(f"Fish Audio failed. Error: {e}")
        else:
            print("âš ï¸ Fish Audio not configured")
            raise RuntimeError("No TTS provider available. Configure Fish Audio API key.")"""

text = re.sub(
    r"        # Strategy 1: Try Fish Audio first \(default\).*?wait for XTTS to initialize\.\n\"\)",
    generate_new,
    text,
    flags=re.DOTALL
)

# Replace clone_voice logic to only use fish
clone_new = """        try:
            # Only Fish Audio
            print(f"í°Ÿ Cloning voice '{voice_name}' with Fish Audio...")
            result = await fish_service.clone_voice(audio_data, voice_name)
            
            return {
                "success": True,
                "voice_id": result.get("id"),
                "provider": "fish_audio",
                "message": "Voice cloned successfully with Fish Audio."
            }
        except Exception as e:
            print(f"âŒ Cloning failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "provider": "fish_audio"
            }"""

text = re.sub(
    r"        try:\n            # Strategy 1.*?(?=    async def list_voices)",
    clone_new + "\n\n",
    text,
    flags=re.DOTALL
)

# Replace list_voices
voices_new = """    async def list_voices(self) -> list[Dict[str, Any]]:
        \"\"\"Get all available custom voices across providers.\"\"\"
        voices = []
        
        # Get Fish Audio voices
        fish_voices = await fish_service.list_voices()
        voices.extend(fish_voices)
        
        return voices"""
text = re.sub(
    r"    async def list_voices\(self\).*?(?=\n\n\n?)",
    voices_new,
    text,
    flags=re.DOTALL
)

with open('d:/Ruben/Sublab/backend/app/services/tts/tts_manager.py', 'w', encoding='utf-8') as f:
    f.write(text)
