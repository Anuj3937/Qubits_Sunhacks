from flask import Flask, request, jsonify
import requests
import json
import logging
from typing import Dict, List, Optional
import time

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

class LlamaService:
    def __init__(self):
        self.ollama_url = "http://localhost:11434"  # Default Ollama URL
        self.model_name = "llama3.1"  # Your locally downloaded model
        self.max_tokens = 2048
        self.temperature = 0.7
        self.check_model_availability()
    
    def check_model_availability(self):
        """Check if Llama model is available in Ollama"""
        try:
            response = requests.get(f"{self.ollama_url}/api/tags")
            if response.status_code == 200:
                models = response.json().get('models', [])
                model_names = [model['name'] for model in models]
                if self.model_name not in model_names and f"{self.model_name}:latest" not in model_names:
                    logging.warning(f"Model {self.model_name} not found. Available models: {model_names}")
                else:
                    logging.info(f"Model {self.model_name} is available")
            else:
                logging.error("Could not connect to Ollama service")
        except Exception as e:
            logging.error(f"Error checking model availability: {e}")
    
    def generate_response(self, prompt: str, max_tokens: int = None, temperature: float = None) -> Dict:
        """Generate response using Ollama API"""
        try:
            payload = {
                "model": self.model_name,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "num_predict": max_tokens or self.max_tokens,
                    "temperature": temperature or self.temperature,
                    "top_p": 0.9,
                    "top_k": 40
                }
            }
            
            response = requests.post(
                f"{self.ollama_url}/api/generate",
                json=payload,
                timeout=120  # 2 minute timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "success": True,
                    "generated_text": result.get("response", ""),
                    "done": result.get("done", False),
                    "total_duration": result.get("total_duration", 0),
                    "load_duration": result.get("load_duration", 0),
                    "prompt_eval_count": result.get("prompt_eval_count", 0),
                    "eval_count": result.get("eval_count", 0)
                }
            else:
                return {
                    "success": False,
                    "error": f"Ollama API returned status {response.status_code}",
                    "details": response.text
                }
                
        except requests.exceptions.Timeout:
            return {
                "success": False,
                "error": "Request timeout - model took too long to respond"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Error calling Ollama API: {str(e)}"
            }
    
    def chat_completion(self, messages: List[Dict], max_tokens: int = None, temperature: float = None) -> Dict:
        """Handle chat-style conversations"""
        try:
            # Convert messages to a single prompt
            prompt = self.messages_to_prompt(messages)
            
            payload = {
                "model": self.model_name,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "num_predict": max_tokens or self.max_tokens,
                    "temperature": temperature or self.temperature,
                    "top_p": 0.9,
                    "top_k": 40,
                    "repeat_penalty": 1.1
                }
            }
            
            response = requests.post(
                f"{self.ollama_url}/api/generate",
                json=payload,
                timeout=120
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "success": True,
                    "response": result.get("response", ""),
                    "done": result.get("done", False),
                    "model": self.model_name,
                    "created": int(time.time()),
                    "usage": {
                        "prompt_tokens": result.get("prompt_eval_count", 0),
                        "completion_tokens": result.get("eval_count", 0),
                        "total_tokens": result.get("prompt_eval_count", 0) + result.get("eval_count", 0)
                    }
                }
            else:
                return {
                    "success": False,
                    "error": f"Chat completion failed with status {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Chat completion error: {str(e)}"
            }
    
    def messages_to_prompt(self, messages: List[Dict]) -> str:
        """Convert chat messages to a single prompt"""
        prompt_parts = []
        
        for message in messages:
            role = message.get("role", "user")
            content = message.get("content", "")
            
            if role == "system":
                prompt_parts.append(f"System: {content}")
            elif role == "user":
                prompt_parts.append(f"Human: {content}")
            elif role == "assistant":
                prompt_parts.append(f"Assistant: {content}")
        
        prompt_parts.append("Assistant:")
        return "\n\n".join(prompt_parts)

# Initialize Llama service
llama_service = LlamaService()

@app.route('/health', methods=['GET'])
def health_check():
    try:
        # Quick health check to Ollama
        response = requests.get(f"{llama_service.ollama_url}/api/tags", timeout=5)
        ollama_healthy = response.status_code == 200
        
        return jsonify({
            "status": "healthy" if ollama_healthy else "degraded",
            "ollama_connected": ollama_healthy,
            "model": llama_service.model_name,
            "timestamp": int(time.time())
        })
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "ollama_connected": False,
            "error": str(e),
            "timestamp": int(time.time())
        })

@app.route('/generate', methods=['POST'])
def generate():
    """Generate text completion"""
    try:
        data = request.get_json()
        
        if not data or 'prompt' not in data:
            return jsonify({"error": "Missing required field: prompt"}), 400
        
        prompt = data['prompt']
        max_tokens = data.get('max_tokens', 1000)
        temperature = data.get('temperature', 0.7)
        
        if not prompt.strip():
            return jsonify({"error": "Prompt cannot be empty"}), 400
        
        if max_tokens > 4096:
            return jsonify({"error": "max_tokens cannot exceed 4096"}), 400
        
        result = llama_service.generate_response(prompt, max_tokens, temperature)
        
        if result["success"]:
            return jsonify(result)
        else:
            return jsonify(result), 500
            
    except Exception as e:
        logging.error(f"Error in generate endpoint: {e}")
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

@app.route('/chat/completions', methods=['POST'])
def chat_completions():
    """OpenAI-compatible chat completions endpoint"""
    try:
        data = request.get_json()
        
        if not data or 'messages' not in data:
            return jsonify({"error": "Missing required field: messages"}), 400
        
        messages = data['messages']
        max_tokens = data.get('max_tokens', 1000)
        temperature = data.get('temperature', 0.7)
        
        if not isinstance(messages, list) or len(messages) == 0:
            return jsonify({"error": "messages must be a non-empty list"}), 400
        
        result = llama_service.chat_completion(messages, max_tokens, temperature)
        
        if result["success"]:
            # Format response to match OpenAI API structure
            formatted_response = {
                "id": f"chatcmpl-{int(time.time())}",
                "object": "chat.completion",
                "created": result["created"],
                "model": result["model"],
                "choices": [{
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": result["response"]
                    },
                    "finish_reason": "stop"
                }],
                "usage": result["usage"]
            }
            return jsonify(formatted_response)
        else:
            return jsonify(result), 500
            
    except Exception as e:
        logging.error(f"Error in chat completions endpoint: {e}")
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

@app.route('/models', methods=['GET'])
def list_models():
    """List available models"""
    try:
        response = requests.get(f"{llama_service.ollama_url}/api/tags", timeout=10)
        
        if response.status_code == 200:
            ollama_models = response.json().get('models', [])
            
            # Format to match OpenAI API structure
            models = []
            for model in ollama_models:
                models.append({
                    "id": model['name'],
                    "object": "model",
                    "created": int(time.time()),
                    "owned_by": "ollama"
                })
            
            return jsonify({
                "object": "list",
                "data": models
            })
        else:
            return jsonify({"error": "Could not fetch models from Ollama"}), 500
            
    except Exception as e:
        return jsonify({"error": f"Error listing models: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8002, debug=False)
