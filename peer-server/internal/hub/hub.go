package hub

import (
	"sync"
)

// Hub manages per-room WebSocket clients and broadcasts messages between them.
type Hub struct {
	mu    sync.RWMutex
	rooms map[string]map[*Client]struct{}
}

// New creates an empty Hub instance.
func New() *Hub {
	return &Hub{rooms: make(map[string]map[*Client]struct{})}
}

// Join registers a client under a room identifier.
func (h *Hub) Join(room string, client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if _, ok := h.rooms[room]; !ok {
		h.rooms[room] = make(map[*Client]struct{})
	}
	h.rooms[room][client] = struct{}{}
}

// Leave removes a client from a room and deletes the room if empty.
func (h *Hub) Leave(room string, client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	clients, ok := h.rooms[room]
	if !ok {
		return
	}
	delete(clients, client)
	if len(clients) == 0 {
		delete(h.rooms, room)
	}
}

// Broadcast sends a message to all clients in the room except the sender.
func (h *Hub) Broadcast(room string, message []byte, sender *Client) {
	h.mu.RLock()
	clients, ok := h.rooms[room]
	h.mu.RUnlock()
	if !ok {
		return
	}
	for client := range clients {
		if client == sender {
			continue
		}
		select {
		case client.send <- message:
		default:
			// drop messages for slow consumers
		}
	}
}

// RoomSize returns the number of active clients in the room.
func (h *Hub) RoomSize(room string) int {
	h.mu.RLock()
	defer h.mu.RUnlock()

	return len(h.rooms[room])
}

// Snapshot returns a copy of current room occupancy sized per room.
func (h *Hub) Snapshot() map[string]int {
	h.mu.RLock()
	defer h.mu.RUnlock()

	copy := make(map[string]int, len(h.rooms))
	for room, clients := range h.rooms {
		copy[room] = len(clients)
	}

	return copy
}
