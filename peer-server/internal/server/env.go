package server

import (
	"bufio"
	"log"
	"os"
	"strings"
)

// LoadEnv loads a .env file (defaults to `.env`) into the process environment.
// It only sets variables that are not already defined.
func LoadEnv(paths ...string) {
	if len(paths) == 0 {
		paths = []string{".env"}
	}
	for _, path := range paths {
		loadDotEnv(path)
	}
}

// loadDotEnv reads key/value pairs from the provided file path and inserts
// them into the process environment if they are not already set. Lines that
// start with '#' or are empty are ignored. This avoids pulling an external
// dependency just to support local development .env files.
func loadDotEnv(path string) {
	file, err := os.Open(path)
	if err != nil {
		return
	}
	defer func() {
		if cerr := file.Close(); cerr != nil {
			log.Printf("[peer] closing .env failed: %v", cerr)
		}
	}()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}

		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])

		if key == "" {
			continue
		}

		if _, exists := os.LookupEnv(key); exists {
			continue
		}

		if err := os.Setenv(key, value); err != nil {
			log.Printf("[peer] unable to set env %s: %v", key, err)
		}
	}

	if err := scanner.Err(); err != nil {
		log.Printf("[peer] reading .env failed: %v", err)
	}
}
