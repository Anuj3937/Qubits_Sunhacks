-- Tutor conversations table
CREATE TABLE IF NOT EXISTS tutor_conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    material_id INTEGER REFERENCES study_materials(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'English',
    complexity VARCHAR(20) DEFAULT 'detailed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Answer explanations table
CREATE TABLE IF NOT EXISTS answer_explanations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    user_answer TEXT NOT NULL,
    explanation TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'English',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User goals table
CREATE TABLE IF NOT EXISTS user_goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    daily_study_minutes INTEGER DEFAULT 30,
    weekly_quiz_goal INTEGER DEFAULT 5,
    flashcard_review_goal INTEGER DEFAULT 20,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add topic column to flashcards if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='flashcards' AND column_name='topic') THEN
        ALTER TABLE flashcards ADD COLUMN topic VARCHAR(100) DEFAULT 'General';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tutor_conversations_user_material ON tutor_conversations(user_id, material_id);
CREATE INDEX IF NOT EXISTS idx_tutor_conversations_created_at ON tutor_conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_answer_explanations_user_id ON answer_explanations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_topic ON flashcards(topic);
CREATE INDEX IF NOT EXISTS idx_study_sessions_date ON study_sessions(session_date);
