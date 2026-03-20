package handlers_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"pianoter/internal/handlers"
	"pianoter/internal/models"

	"github.com/go-chi/chi/v5"
)

func setupSessionRouter(t *testing.T, userID uint) (*handlers.SessionHandler, *chi.Mux) {
	t.Helper()
	db := setupDB(t)
	h := &handlers.SessionHandler{DB: db}
	r := chi.NewRouter()
	r.Use(injectUser(userID))
	r.Post("/pieces/{id}/sessions", h.Create)
	r.Get("/pieces/{id}/sessions", h.List)
	return h, r
}

func TestSessionCreate_Returns201AndUpdatesLastPlayedAt(t *testing.T) {
	h, r := setupSessionRouter(t, 1)

	piece := models.Piece{UserID: 1, Title: "Nocturne", Status: "active"}
	h.DB.Create(&piece)

	playedAt := time.Now().UTC().Truncate(time.Second)
	body := fmt.Sprintf(`{"played_at":"%s","notes":"Good session"}`, playedAt.Format(time.RFC3339))
	req := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/pieces/%d/sessions", piece.ID), bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rr.Code, rr.Body.String())
	}

	var s map[string]any
	if err := json.NewDecoder(rr.Body).Decode(&s); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}
	if s["piece_id"].(float64) != float64(piece.ID) {
		t.Errorf("expected piece_id %d, got %v", piece.ID, s["piece_id"])
	}

	// Verify last_played_at was updated on the piece
	var updated models.Piece
	h.DB.First(&updated, piece.ID)
	if updated.LastPlayedAt == nil {
		t.Fatal("expected last_played_at to be set on piece")
	}
}

func TestSessionCreate_UpdatesCurrentLevelWhenPlayingLevelSet(t *testing.T) {
	h, r := setupSessionRouter(t, 1)

	piece := models.Piece{UserID: 1, Title: "Ballade", Status: "active"}
	h.DB.Create(&piece)

	body := `{"notes":"With level","playing_level":"page 3"}`
	req := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/pieces/%d/sessions", piece.ID), bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rr.Code, rr.Body.String())
	}

	// Verify current_level was updated on the piece
	var updated models.Piece
	h.DB.First(&updated, piece.ID)
	if updated.CurrentLevel != "page 3" {
		t.Errorf("expected current_level 'page 3', got %q", updated.CurrentLevel)
	}
}

func TestSessionCreate_DoesNotUpdateCurrentLevelWhenNoPlayingLevel(t *testing.T) {
	h, r := setupSessionRouter(t, 1)

	piece := models.Piece{UserID: 1, Title: "Sonata", Status: "active", CurrentLevel: "existing level"}
	h.DB.Create(&piece)

	body := `{"notes":"No level recorded"}`
	req := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/pieces/%d/sessions", piece.ID), bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rr.Code, rr.Body.String())
	}

	var updated models.Piece
	h.DB.First(&updated, piece.ID)
	if updated.CurrentLevel != "existing level" {
		t.Errorf("expected current_level unchanged 'existing level', got %q", updated.CurrentLevel)
	}
}

func TestSessionList_ReturnsSessionsInDescendingOrder(t *testing.T) {
	h, r := setupSessionRouter(t, 1)

	piece := models.Piece{UserID: 1, Title: "Etude", Status: "active"}
	h.DB.Create(&piece)

	t1 := time.Now().Add(-2 * time.Hour)
	t2 := time.Now().Add(-1 * time.Hour)
	t3 := time.Now()

	h.DB.Create(&models.PlaySession{PieceID: piece.ID, PlayedAt: t1, Notes: "first"})
	h.DB.Create(&models.PlaySession{PieceID: piece.ID, PlayedAt: t2, Notes: "second"})
	h.DB.Create(&models.PlaySession{PieceID: piece.ID, PlayedAt: t3, Notes: "third"})

	req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/pieces/%d/sessions", piece.ID), nil)
	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	var sessions []map[string]any
	if err := json.NewDecoder(rr.Body).Decode(&sessions); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}
	if len(sessions) != 3 {
		t.Fatalf("expected 3 sessions, got %d", len(sessions))
	}

	// Sessions should be in descending order; first result should be newest (third)
	if sessions[0]["notes"] != "third" {
		t.Errorf("expected first session to be 'third' (newest), got %v", sessions[0]["notes"])
	}
	if sessions[2]["notes"] != "first" {
		t.Errorf("expected last session to be 'first' (oldest), got %v", sessions[2]["notes"])
	}
}
