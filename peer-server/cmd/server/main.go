package main

import (
	"log"

	"github.com/meet2code/peer-server/internal/server"
)

func main() {
	server.LoadEnv()
	srv := server.New()
	if err := srv.Run(); err != nil {
		log.Fatalf("peer server exited: %v", err)
	}
}
