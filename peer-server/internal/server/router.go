package server

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"

	"github.com/meet2code/peer-server/internal/hub"
)

// Server bundles HTTP routes and WebSocket management.
type Server struct {
	hub      *hub.Hub
	upgrader websocket.Upgrader
	engine   *gin.Engine
}

// New builds a server with sane defaults.
func New() *Server {
	gin.SetMode(gin.ReleaseMode)
	engine := gin.New()
	engine.Use(gin.Logger(), gin.Recovery())

	s := &Server{
		hub: hub.New(),
		upgrader: websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin: func(r *http.Request) bool {
				// TODO: configure allowed origins
				return true
			},
		},
		engine: engine,
	}

	s.registerRoutes()
	return s
}

func (s *Server) registerRoutes() {
	s.engine.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "UP",
			"service": "peer-server",
			"rooms":   s.hub.Snapshot(),
		})
	})

	s.engine.GET("/ws/:room", s.handleWebSocket)
}

// Run starts the HTTP server on the provided port.
func (s *Server) Run() error {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	httpServer := &http.Server{
		Addr:              ":" + port,
		Handler:           s.engine,
		ReadHeaderTimeout: 10 * time.Second,
	}

	log.Printf("[peer] listening on http://localhost:%s", port)
	return httpServer.ListenAndServe()
}

func (s *Server) handleWebSocket(c *gin.Context) {
	room := c.Param("room")
	if room == "" {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "room is required"})
		return
	}

	conn, err := s.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("[peer] upgrade failure: %v", err)
		return
	}

	clientID := c.Query("clientId")
	if clientID == "" {
		clientID = conn.RemoteAddr().String()
	}

	client := hub.NewClient(s.hub, conn, room, clientID)
	s.hub.Join(room, client)
	client.Run()
	client.Close()
}
