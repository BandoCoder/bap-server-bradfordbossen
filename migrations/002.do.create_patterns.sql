CREATE TABLE patterns (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    title TEXT NOT NULL,
    box_count INTEGER NOT NULL,
    user_ref INTEGER
        REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    pattern_ref INTEGER UNIQUE NOT NULL




);