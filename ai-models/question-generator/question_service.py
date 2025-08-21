from flask import Flask, request, jsonify
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import logging
import json
import re
from typing import List, Dict

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

class T5QuestionGenerator:
    def __init__(self):
        self.model_name = "iarfmoose/t5-base-question-generator"
        self.tokenizer = None
        self.model = None
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.load_model()
    
    def load_model(self):
        """Load the T5 question generation model"""
        try:
            logging.info("Loading T5 question generation model...")
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model = AutoModelForSeq2SeqLM.from_pretrained(self.model_name)
            self.model.to(self.device)
            self.model.eval()
            logging.info("Model loaded successfully!")
        except Exception as e:
            logging.error(f"Error loading model: {e}")
            raise e
    
    def preprocess_text(self, text: str, max_length: int = 512) -> List[str]:
        """Split text into chunks suitable for processing"""
        sentences = re.split(r'[.!?]+', text)
        chunks = []
        current_chunk = ""
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
                
            if len(current_chunk + sentence) < max_length:
                current_chunk += sentence + ". "
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = sentence + ". "
        
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks[:5]  # Limit to 5 chunks for performance
    
    def generate_questions_from_text(self, context: str, max_questions: int = 10) -> List[Dict]:
        """Generate questions from context text"""
        try:
            chunks = self.preprocess_text(context)
            all_questions = []
            
            for chunk in chunks:
                # Extract potential answers (important nouns, concepts)
                answers = self.extract_key_concepts(chunk)
                
                for answer in answers[:3]:  # Max 3 answers per chunk
                    if len(all_questions) >= max_questions:
                        break
                    
                    input_text = f"answer: {answer} context: {chunk}"
                    
                    # Tokenize and generate
                    inputs = self.tokenizer.encode(
                        input_text,
                        return_tensors="pt",
                        max_length=512,
                        truncation=True
                    ).to(self.device)
                    
                    with torch.no_grad():
                        outputs = self.model.generate(
                            inputs,
                            max_length=64,
                            num_return_sequences=1,
                            temperature=0.7,
                            do_sample=True,
                            pad_token_id=self.tokenizer.pad_token_id,
                            eos_token_id=self.tokenizer.eos_token_id
                        )
                    
                    question = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
                    
                    # Generate multiple choice options
                    options = self.generate_mcq_options(answer, chunk)
                    
                    question_obj = {
                        "id": f"q_{len(all_questions) + 1}_{hash(question) % 1000}",
                        "question": question,
                        "type": "multiple_choice",
                        "options": options,
                        "correct_answer": answer,
                        "explanation": f"This question tests understanding of {answer} in the given context.",
                        "difficulty": self.assess_difficulty(question, chunk),
                        "topic": self.extract_topic(chunk)
                    }
                    
                    all_questions.append(question_obj)
                
                if len(all_questions) >= max_questions:
                    break
            
            return all_questions
            
        except Exception as e:
            logging.error(f"Error generating questions: {e}")
            return []
    
    def extract_key_concepts(self, text: str) -> List[str]:
        """Extract key concepts that can serve as answers"""
        # Simple extraction - in production, you might use NER or more sophisticated methods
        words = re.findall(r'\b[A-Z][a-z]+\b|\b[a-z]{4,}\b', text)
        
        # Filter out common words
        stop_words = {'this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 'were', 'said', 'each', 'which', 'their', 'time', 'more', 'very', 'when', 'come', 'here', 'there', 'could', 'other'}
        
        concepts = [word for word in words if word.lower() not in stop_words and len(word) > 3]
        
        # Remove duplicates while preserving order
        seen = set()
        unique_concepts = []
        for concept in concepts:
            if concept.lower() not in seen:
                seen.add(concept.lower())
                unique_concepts.append(concept)
        
        return unique_concepts[:10]  # Return top 10 concepts
    
    def generate_mcq_options(self, correct_answer: str, context: str) -> List[str]:
        """Generate plausible multiple choice options"""
        # Extract other concepts from context as distractors
        concepts = self.extract_key_concepts(context)
        options = [correct_answer]
        
        # Add distractors
        for concept in concepts:
            if concept.lower() != correct_answer.lower() and len(options) < 4:
                options.append(concept)
        
        # Fill remaining slots with generic distractors if needed
        generic_distractors = ["None of the above", "All of the above", "Cannot be determined", "Insufficient information"]
        
        while len(options) < 4:
            for distractor in generic_distractors:
                if distractor not in options and len(options) < 4:
                    options.append(distractor)
                    break
        
        return options
    
    def assess_difficulty(self, question: str, context: str) -> str:
        """Assess question difficulty based on various factors"""
        question_length = len(question.split())
        context_complexity = len(context.split())
        
        if question_length > 15 or context_complexity > 200:
            return "hard"
        elif question_length > 10 or context_complexity > 100:
            return "medium"
        else:
            return "easy"
    
    def extract_topic(self, text: str) -> str:
        """Extract the main topic from text"""
        # Simple topic extraction - could be enhanced with NLP libraries
        words = text.split()
        if len(words) > 0:
            # Look for capitalized words or longer words as potential topics
            for word in words:
                if word.istitle() and len(word) > 4:
                    return word
        
        return "General"

# Initialize the question generator
question_generator = T5QuestionGenerator()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "model_loaded": question_generator.model is not None})

@app.route('/generate-questions', methods=['POST'])
def generate_questions():
    try:
        data = request.get_json()
        
        if not data or 'context' not in data:
            return jsonify({"error": "Missing required field: context"}), 400
        
        context = data['context']
        max_questions = data.get('max_questions', 10)
        question_types = data.get('question_types', ['multiple_choice'])
        
        if not context.strip():
            return jsonify({"error": "Context cannot be empty"}), 400
        
        if max_questions > 20:
            return jsonify({"error": "Maximum 20 questions allowed per request"}), 400
        
        # Generate questions
        questions = question_generator.generate_questions_from_text(context, max_questions)
        
        if not questions:
            return jsonify({"error": "Failed to generate questions from the provided context"}), 500
        
        return jsonify({
            "success": True,
            "questions": questions,
            "total_generated": len(questions),
            "context_length": len(context)
        })
        
    except Exception as e:
        logging.error(f"Error in generate_questions endpoint: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/generate-batch-questions', methods=['POST'])
def generate_batch_questions():
    """Generate questions from multiple contexts"""
    try:
        data = request.get_json()
        
        if not data or 'contexts' not in data:
            return jsonify({"error": "Missing required field: contexts"}), 400
        
        contexts = data['contexts']
        max_questions_per_context = data.get('max_questions_per_context', 5)
        
        if not isinstance(contexts, list) or len(contexts) == 0:
            return jsonify({"error": "Contexts must be a non-empty list"}), 400
        
        if len(contexts) > 10:
            return jsonify({"error": "Maximum 10 contexts allowed per batch"}), 400
        
        all_questions = []
        
        for i, context in enumerate(contexts):
            if context.strip():
                questions = question_generator.generate_questions_from_text(
                    context, max_questions_per_context
                )
                
                # Add context index to each question
                for question in questions:
                    question['context_index'] = i
                    question['id'] = f"batch_{i}_{question['id']}"
                
                all_questions.extend(questions)
        
        return jsonify({
            "success": True,
            "questions": all_questions,
            "total_generated": len(all_questions),
            "contexts_processed": len(contexts)
        })
        
    except Exception as e:
        logging.error(f"Error in generate_batch_questions endpoint: {e}")
        return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8001, debug=False)

