-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    birth_date DATE,
    academic_level VARCHAR(50) DEFAULT 'intermediate',
    preferred_language VARCHAR(10) DEFAULT 'English',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Study materials table
CREATE TABLE study_materials (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    original_text TEXT,
    processed_content JSONB,
    file_type VARCHAR(50),
    file_size INTEGER,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processing_status VARCHAR(20) DEFAULT 'pending'
);

-- Flashcards table
CREATE TABLE flashcards (
    id SERIAL PRIMARY KEY,
    material_id INTEGER REFERENCES study_materials(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    front_text TEXT NOT NULL,
    back_text TEXT NOT NULL,
    difficulty_level INTEGER DEFAULT 1,
    next_review DATE DEFAULT CURRENT_DATE,
    review_count INTEGER DEFAULT 0,
    ease_factor DECIMAL(3,2) DEFAULT 2.5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quiz attempts table
CREATE TABLE quiz_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    material_id INTEGER REFERENCES study_materials(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    wrong_answers JSONB,
    time_taken INTEGER, -- in seconds
    attempt_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User progress tracking
CREATE TABLE user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    strength_score DECIMAL(5,2) DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    last_studied TIMESTAMP,
    study_streak INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, subject)
);

-- Study sessions
CREATE TABLE study_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    material_id INTEGER REFERENCES study_materials(id) ON DELETE CASCADE,
    session_type VARCHAR(50) NOT NULL, -- 'quiz', 'flashcard', 'reading'
    duration INTEGER NOT NULL, -- in minutes
    topics_covered TEXT[],
    session_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_study_materials_user_id ON study_materials(user_id);
CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX idx_flashcards_next_review ON flashcards(next_review);
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
