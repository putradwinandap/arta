package config

import "os"

type Config struct {
	HTTPAddr      string
	DatabaseURL   string
	SessionSecret string
}

func FromEnv() Config {
	return Config{
		HTTPAddr:      valueOrDefault("ARTA_HTTP_ADDR", ":8080"),
		DatabaseURL:   valueOrDefault("ARTA_DATABASE_URL", "postgres://arta:arta@localhost:5432/arta?sslmode=disable"),
		SessionSecret: os.Getenv("ARTA_SESSION_SECRET"),
	}
}

func valueOrDefault(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
