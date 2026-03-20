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

func setupPieceRouter(t *testing.T, userID uint) (*handlers.PieceHandler, *chi.Mux) {
	t.Helper()
	db := setupDB(t)
	h := &handlers.PieceHandler{DB: db}
	r := chi.NewRouter()
	r.Use(injectUser(userID))
	r.Get("/pieces", h.List)
	r.Post("/pieces", h.Create)
	r.Get("/pieces/{id}", h.Get)
	r.Put("/pieces/{id}", h.Update)
	r.Delete("/pieces/{id}", h.Delete)
	return h, r
}

func TestPieceList_ReturnsPiecesForUser(t *testing.T) {
	h, r := setupPieceRouter(t, 1)

	piece := models.Piece{UserID: 1, Title: "Moonlight Sonata", Status: "active"}
	h.DB.Create(&piece)

	req := httptest.NewRequest(http.MethodGet, "/pieces", nil)
	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	var pieces []map[string]any
	if err := json.NewDecoder(rr.Body).Decode(&pieces); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}
	if len(pieces) != 1 {
		t.Errorf("expected 1 piece, got %d", len(pieces))
	}
	if pieces[0]["title"] != "Moonlight Sonata" {
		t.Errorf("unexpected title: %v", pieces[0]["title"])
	}
}

func TestPieceList_DoesNotReturnOtherUsersPieces(t *testing.T) {
	h, r := setupPieceRouter(t, 1)

	// other user's piece
	other := models.Piece{UserID: 2, Title: "Other Piece", Status: "active"}
	h.DB.Create(&other)

	req := httptest.NewRequest(http.MethodGet, "/pieces", nil)
	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)

	var pieces []map[string]any
	if err := json.NewDecoder(rr.Body).Decode(&pieces); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}
	if len(pieces) != 0 {
		t.Errorf("expected 0 pieces, got %d", len(pieces))
	}
}

func TestPieceList_FiltersByStatus(t *testing.T) {
	h, r := setupPieceRouter(t, 1)

	h.DB.Create(&models.Piece{UserID: 1, Title: "Active Piece", Status: "active"})
	h.DB.Create(&models.Piece{UserID: 1, Title: "Wishlist Piece", Status: "wishlist"})

	req := httptest.NewRequest(http.MethodGet, "/pieces?status=active", nil)
	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)

	var pieces []map[string]any
	if err := json.NewDecoder(rr.Body).Decode(&pieces); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}
	if len(pieces) != 1 {
		t.Errorf("expected 1 piece, got %d", len(pieces))
	}
	if pieces[0]["status"] != "active" {
		t.Errorf("expected status 'active', got %v", pieces[0]["status"])
	}
}

func TestPieceList_FiltersByComposerID(t *testing.T) {
	h, r := setupPieceRouter(t, 1)

	c1 := models.Composer{UserID: 1, Name: "Composer1"}
	c2 := models.Composer{UserID: 1, Name: "Composer2"}
	h.DB.Create(&c1)
	h.DB.Create(&c2)

	h.DB.Create(&models.Piece{UserID: 1, Title: "Piece1", ComposerID: c1.ID})
	h.DB.Create(&models.Piece{UserID: 1, Title: "Piece2", ComposerID: c2.ID})

	req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/pieces?composer_id=%d", c1.ID), nil)
	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)

	var pieces []map[string]any
	if err := json.NewDecoder(rr.Body).Decode(&pieces); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}
	if len(pieces) != 1 {
		t.Errorf("expected 1 piece for composer_id=%d, got %d", c1.ID, len(pieces))
	}
}

func TestPieceList_StaleDaysFilter(t *testing.T) {
	h, r := setupPieceRouter(t, 1)

	// piece played 30 days ago (stale)
	oldDate := time.Now().AddDate(0, 0, -30)
	stalePiece := models.Piece{UserID: 1, Title: "Stale Piece", Status: "active", LastPlayedAt: &oldDate}
	h.DB.Create(&stalePiece)

	// piece played today (fresh)
	now := time.Now()
	freshPiece := models.Piece{UserID: 1, Title: "Fresh Piece", Status: "active", LastPlayedAt: &now}
	h.DB.Create(&freshPiece)

	// piece never played — should NOT appear in stale results
	h.DB.Create(&models.Piece{UserID: 1, Title: "Never Played", Status: "active"})

	req := httptest.NewRequest(http.MethodGet, "/pieces?stale_days=7", nil)
	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)

	var pieces []map[string]any
	if err := json.NewDecoder(rr.Body).Decode(&pieces); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}
	// Should return only stalePiece; fresh and never-played are excluded
	if len(pieces) != 1 {
		t.Errorf("expected 1 stale piece, got %d", len(pieces))
	}
	if len(pieces) > 0 && pieces[0]["title"] != "Stale Piece" {
		t.Errorf("expected 'Stale Piece', got %v", pieces[0]["title"])
	}
}

func TestPieceCreate_Returns201(t *testing.T) {
	_, r := setupPieceRouter(t, 1)

	body := `{"title":"Fur Elise","status":"learning","difficulty":4}`
	req := httptest.NewRequest(http.MethodPost, "/pieces", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rr.Code, rr.Body.String())
	}

	var p map[string]any
	if err := json.NewDecoder(rr.Body).Decode(&p); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}
	if p["title"] != "Fur Elise" {
		t.Errorf("expected title 'Fur Elise', got %v", p["title"])
	}
	if p["status"] != "learning" {
		t.Errorf("expected status 'learning', got %v", p["status"])
	}
	if p["difficulty"].(float64) != 4 {
		t.Errorf("expected difficulty 4, got %v", p["difficulty"])
	}
	if p["user_id"].(float64) != 1 {
		t.Errorf("expected user_id 1, got %v", p["user_id"])
	}
}

func TestPieceGet_ReturnsPieceByID(t *testing.T) {
	h, r := setupPieceRouter(t, 1)

	piece := models.Piece{UserID: 1, Title: "Waldstein", Status: "active"}
	h.DB.Create(&piece)

	req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/pieces/%d", piece.ID), nil)
	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	var p map[string]any
	if err := json.NewDecoder(rr.Body).Decode(&p); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}
	if p["title"] != "Waldstein" {
		t.Errorf("expected title 'Waldstein', got %v", p["title"])
	}
}

func TestPieceGet_404ForWrongUser(t *testing.T) {
	h, r := setupPieceRouter(t, 1)

	// piece belongs to user 2
	piece := models.Piece{UserID: 2, Title: "Other Piece", Status: "active"}
	h.DB.Create(&piece)

	req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/pieces/%d", piece.ID), nil)
	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", rr.Code)
	}
}

func TestPieceUpdate_UpdatesFields(t *testing.T) {
	h, r := setupPieceRouter(t, 1)

	piece := models.Piece{UserID: 1, Title: "Original", Status: "wishlist", Difficulty: 3}
	h.DB.Create(&piece)

	body := `{"title":"Updated Title","status":"active","difficulty":7}`
	req := httptest.NewRequest(http.MethodPut, fmt.Sprintf("/pieces/%d", piece.ID), bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var p map[string]any
	if err := json.NewDecoder(rr.Body).Decode(&p); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}
	if p["title"] != "Updated Title" {
		t.Errorf("expected title 'Updated Title', got %v", p["title"])
	}
	if p["status"] != "active" {
		t.Errorf("expected status 'active', got %v", p["status"])
	}
	if p["difficulty"].(float64) != 7 {
		t.Errorf("expected difficulty 7, got %v", p["difficulty"])
	}
}

func TestPieceDelete_OwnPiece(t *testing.T) {
	h, r := setupPieceRouter(t, 1)

	piece := models.Piece{UserID: 1, Title: "To Delete", Status: "active"}
	h.DB.Create(&piece)

	req := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/pieces/%d", piece.ID), nil)
	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestPieceCreate_SavesNotes(t *testing.T) {
	_, r := setupPieceRouter(t, 1)

	body := `{"title":"Für Elise","status":"learning","difficulty":4,"notes":"Focus on bars 24–48"}`
	req := httptest.NewRequest(http.MethodPost, "/pieces", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rr.Code, rr.Body.String())
	}
	var p map[string]any
	json.NewDecoder(rr.Body).Decode(&p)
	if p["notes"] != "Focus on bars 24–48" {
		t.Errorf("expected notes to be saved, got %v", p["notes"])
	}
}

func TestPieceUpdate_SavesNotes(t *testing.T) {
	h, r := setupPieceRouter(t, 1)

	piece := models.Piece{UserID: 1, Title: "Waldstein", Status: "active"}
	h.DB.Create(&piece)

	body := `{"title":"Waldstein","status":"active","notes":"Currently polishing the coda"}`
	req := httptest.NewRequest(http.MethodPut, fmt.Sprintf("/pieces/%d", piece.ID), bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}
	var p map[string]any
	json.NewDecoder(rr.Body).Decode(&p)
	if p["notes"] != "Currently polishing the coda" {
		t.Errorf("expected notes to be updated, got %v", p["notes"])
	}
}

func TestPieceDelete_404ForAnotherUsersPiece(t *testing.T) {
	h, r := setupPieceRouter(t, 1)

	// piece belongs to user 2
	piece := models.Piece{UserID: 2, Title: "Other User Piece", Status: "active"}
	h.DB.Create(&piece)

	req := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/pieces/%d", piece.ID), nil)
	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", rr.Code)
	}
}
