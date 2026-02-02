package hub

import (
	"fmt"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 5120
)

// Client represents a single WebSocket participant.
type Client struct {
	hub  *Hub
	conn *websocket.Conn
	room string
	send chan []byte
	id   string
}

// NewClient constructs a Client bound to a room and hub.
func NewClient(h *Hub, conn *websocket.Conn, room, id string) *Client {
	client := &Client{
		hub:  h,
		conn: conn,
		room: room,
		send: make(chan []byte, 32),
		id:   id,
	}
	client.conn.SetReadLimit(maxMessageSize)
	client.conn.SetReadDeadline(time.Now().Add(pongWait))
	client.conn.SetPongHandler(func(string) error {
		client.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})
	return client
}

// Run spins readers and writers for the WebSocket connection.
func (c *Client) Run() {
	go c.writePump()
	c.readPump()
}

func (c *Client) readPump() {
	defer func() {
		c.hub.Leave(c.room, c)
		leave := fmt.Sprintf(`{"type":"leave","clientId":"%s"}`, c.id)
		c.hub.Broadcast(c.room, []byte(leave), nil)
		_ = c.conn.Close()
	}()

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("[peer] unexpected close from %s: %v", c.id, err)
			}
			break
		}
		c.hub.Broadcast(c.room, message, c)
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		_ = c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// channel closed
				_ = c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			writer, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			if _, err := writer.Write(message); err != nil {
				return
			}
			if err := writer.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// Close tears down the client and its channels.
func (c *Client) Close() {
	close(c.send)
}
