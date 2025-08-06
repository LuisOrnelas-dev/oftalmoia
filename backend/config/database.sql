-- Crear base de datos (ejecutar manualmente)
-- CREATE DATABASE oftalmoia_db;

-- Tabla de usuarios
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('patient', 'doctor')),
    profile_image VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de doctores (extensión de users)
CREATE TABLE doctors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    specialty VARCHAR(255) NOT NULL,
    experience_years INTEGER,
    languages TEXT[],
    consultation_fee DECIMAL(10,2),
    availability JSONB,
    rating DECIMAL(3,2) DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    image_url VARCHAR(500),
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de citas
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de reseñas
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de análisis de síntomas
CREATE TABLE symptom_analyses (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    symptoms TEXT NOT NULL,
    ai_response TEXT,
    recommended_specialties TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_doctors_specialty ON doctors(specialty);
CREATE INDEX idx_doctors_location ON doctors(location);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar datos de ejemplo
INSERT INTO users (name, email, password_hash, phone, user_type) VALUES
('Dr. Juan Pérez', 'dr.juan.perez@oftalmoia.com', '$2b$10$example_hash', '+52 55 1234 5678', 'doctor'),
('Dra. María López', 'dra.maria.lopez@oftalmoia.com', '$2b$10$example_hash', '+52 33 9876 5432', 'doctor'),
('Dr. Carlos Sánchez', 'dr.carlos.sanchez@oftalmoia.com', '$2b$10$example_hash', '+52 81 5555 1234', 'doctor'),
('Dra. Ana Rodríguez', 'dra.ana.rodriguez@oftalmoia.com', '$2b$10$example_hash', '+52 222 123 4567', 'doctor'),
('Dr. Luis Fernández', 'dr.luis.fernandez@oftalmoia.com', '$2b$10$example_hash', '+52 664 987 6543', 'doctor');

INSERT INTO doctors (user_id, specialty, experience_years, languages, consultation_fee, availability, rating, reviews_count, image_url, location) VALUES
(1, 'Oftalmología Pediátrica', 15, ARRAY['Español', 'Inglés'], 800.00, '{"schedule": "Lun-Vie 9:00-17:00"}', 4.8, 127, 'https://randomuser.me/api/portraits/men/32.jpg', 'CDMX'),
(2, 'Cirugía Refractiva', 12, ARRAY['Español'], 1200.00, '{"schedule": "Mar-Jue 8:00-16:00"}', 4.9, 89, 'https://randomuser.me/api/portraits/women/44.jpg', 'Guadalajara'),
(3, 'Glaucoma', 18, ARRAY['Español', 'Inglés'], 950.00, '{"schedule": "Lun-Sáb 10:00-18:00"}', 4.7, 203, 'https://randomuser.me/api/portraits/men/56.jpg', 'Monterrey'),
(4, 'Retina y Vítreo', 14, ARRAY['Español'], 1100.00, '{"schedule": "Lun-Vie 9:00-15:00"}', 4.6, 156, 'https://randomuser.me/api/portraits/women/60.jpg', 'Puebla'),
(5, 'Córnea y Enfermedades Externas', 10, ARRAY['Español', 'Inglés'], 750.00, '{"schedule": "Mar-Sáb 8:00-14:00"}', 4.5, 78, 'https://randomuser.me/api/portraits/men/45.jpg', 'Tijuana'); 