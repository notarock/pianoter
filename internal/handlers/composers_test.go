package handlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"pianoter/internal/handlers"
	"pianoter/internal/middleware"
	"pianoter/internal/models"

	"github.com/go-chi/chi/v5"
)

func injectUser(userID uint) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := context.WithValue(r.Context(), middleware.UserIDKey, userID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func newComposerRouter(db interface{ Create(any) any }, userID uint) *chi.Mux {
	panic("use newComposerRouterDB")
}

func setupComposerRouter(t *testing.T, userID uint) (*handlers.ComposerHandler, *chi.Mux) {
	t.Helper()
	db := setupDB(t)
	h := &handlers.ComposerHandler{DB: db}
	r := chi.NewRouter()
	r.Use(injectUser(userID))
	r.Get("/composers", h.List)
	r.Post("/composers", h.Create)
	r.Get("/composers/{id}", h.Get)
	r.Put("/composers/{id}", h.Update)
	r.Delete("/composers/{id}", h.Delete)
	return h, r
}

func TestComposerList_ReturnsSystemAndOwnComposers(t *testing.T) {
	h, r := setupComposerRouter(t, 1)

	// system composer (user_id=0)
	system := models.Composer{UserID: 0, Name: "Bach"}
	h.DB.Create(&system)

	// own composer
	own := models.Composer{UserID: 1, Name: "MyComposer"}
	h.DB.Create(&own)

	req := httptest.NewRequest(http.MethodGet, "/composers", nil)
	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	var composers []map[string]any
	if err := json.NewDecoder(rr.Body).Decode(&composers); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}
	if len(composers) != 2 {
		t.Errorf("expected 2 composers, got %d", len(composers))
	}
}

func TestComposerList_DoesNotReturnOtherUsersComposers(t *testing.T) {
	h, r := setupComposerRouter(t, 1)

	// other user's composer
	other := models.Composer{UserID: 2, Name: "OtherUser"}
	h.DB.Create(&other)

	req := httptest.NewRequest(http.MethodGet, "/composers", nil)
	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)

	var composers []map[string]any
	if err := json.NewDecoder(rr.Body).Decode(&composers); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}
	for _, c := range composers {
		uid := c["user_id"].(float64)
		if uid == 2 {
			t.Error("should not return other user's composer")
		}
	}
}

func TestComposerCreate_BelongsToAuthenticatedUser(t *testing.T) {
	h, r := setupComposerRouter(t, 5)

	body := `{"name":"Chopin","nationality":"Polish"}`
	req := httptest.NewRequest(http.MethodPost, "/composers", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rr.Code, rr.Body.String())
	}

	var c map[string]any
	if err := json.NewDecoder(rr.Body).Decode(&c); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}
	if c["name"] != "Chopin" {
		t.Errorf("expected name 'Chopin', got %v", c["name"])
	}
	if c["user_id"].(float64) != 5 {
		t.Errorf("expected user_id 5, got %v", c["user_id"])
	}

	// verify in DB
	var dbComposer models.Composer
	h.DB.First(&dbComposer, uint(c["id"].(float64)))
	if dbComposer.UserID != 5 {
		t.Errorf("DB record has user_id %d, expected 5", dbComposer.UserID)
	}
}

func TestComposerGet_ReturnsById(t *testing.T) {
	h, r := setupComposerRouter(t, 1)

	composer := models.Composer{UserID: 1, Name: "Mozart"}
	h.DB.Create(&composer)

	req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/composers/%d", composer.ID), nil)
	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	var c map[string]any
	if err := json.NewDecoder(rr.Body).Decode(&c); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}
	if c["name"] != "Mozart" {
		t.Errorf("expected name 'Mozart', got %v", c["name"])
	}
}

func TestComposerDelete_OwnComposer(t *testing.T) {
	h, r := setupComposerRouter(t, 1)

	composer := models.Composer{UserID: 1, Name: "Beethoven"}
	h.DB.Create(&composer)

	req := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/composers/%d", composer.ID), nil)
	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestComposerDelete_CannotDeleteSystemComposer(t *testing.T) {
	h, r := setupComposerRouter(t, 1)

	system := models.Composer{UserID: 0, Name: "Schubert"}
	h.DB.Create(&system)

	req := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/composers/%d", system.ID), nil)
	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", rr.Code)
	}
}

func TestComposerDelete_CannotDeleteOtherUsersComposer(t *testing.T) {
	h, r := setupComposerRouter(t, 1)

	other := models.Composer{UserID: 2, Name: "Brahms"}
	h.DB.Create(&other)

	req := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/composers/%d", other.ID), nil)
	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d: %s", rr.Code, rr.Body.String())
	}
}
