package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"pianoter/internal/handlers"
	"pianoter/internal/models"

	"github.com/go-chi/chi/v5"
	"golang.org/x/crypto/bcrypt"
)

func newAuthRouter(t *testing.T) (*handlers.AuthHandler, *chi.Mux) {
	t.Helper()
	db := setupDB(t)
	h := &handlers.AuthHandler{DB: db, Secret: testSecret}
	r := chi.NewRouter()
	r.Post("/register", h.Register)
	r.Post("/login", h.Login)
	return h, r
}

func TestRegister_Success(t *testing.T) {
	_, r := newAuthRouter(t)

	body := `{"username":"alice","password":"secret123"}`
	req := httptest.NewRequest(http.MethodPost, "/register", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp map[string]any
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if _, ok := resp["token"]; !ok {
		t.Error("expected token in response")
	}
	user, ok := resp["user"].(map[string]any)
	if !ok {
		t.Fatal("expected user object in response")
	}
	if user["username"] != "alice" {
		t.Errorf("expected username 'alice', got %v", user["username"])
	}
}

func TestRegister_DuplicateUsername(t *testing.T) {
	_, r := newAuthRouter(t)

	body := `{"username":"bob","password":"pass"}`
	for i := range 2 {
		req := httptest.NewRequest(http.MethodPost, "/register", bytes.NewBufferString(body))
		req.Header.Set("Content-Type", "application/json")
		rr := httptest.NewRecorder()
		r.ServeHTTP(rr, req)
		if i == 0 && rr.Code != http.StatusCreated {
			t.Fatalf("first register expected 201, got %d", rr.Code)
		}
		if i == 1 && rr.Code != http.StatusConflict {
			t.Fatalf("duplicate register expected 409, got %d: %s", rr.Code, rr.Body.String())
		}
	}
}

func TestRegister_MissingFields(t *testing.T) {
	_, r := newAuthRouter(t)

	cases := []string{
		`{"username":"","password":"pass"}`,
		`{"username":"user","password":""}`,
		`{}`,
	}
	for _, body := range cases {
		req := httptest.NewRequest(http.MethodPost, "/register", bytes.NewBufferString(body))
		req.Header.Set("Content-Type", "application/json")
		rr := httptest.NewRecorder()
		r.ServeHTTP(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for body %q, got %d", body, rr.Code)
		}
	}
}

func TestLogin_Success(t *testing.T) {
	h, r := newAuthRouter(t)

	// seed a user
	hash, _ := bcrypt.GenerateFromPassword([]byte("mypassword"), bcrypt.MinCost)
	user := models.User{Username: "carol", PasswordHash: string(hash)}
	h.DB.Create(&user)

	body := `{"username":"carol","password":"mypassword"}`
	req := httptest.NewRequest(http.MethodPost, "/login", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp map[string]any
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if _, ok := resp["token"]; !ok {
		t.Error("expected token in response")
	}
}

func TestLogin_WrongPassword(t *testing.T) {
	h, r := newAuthRouter(t)

	hash, _ := bcrypt.GenerateFromPassword([]byte("correctpass"), bcrypt.MinCost)
	user := models.User{Username: "dave", PasswordHash: string(hash)}
	h.DB.Create(&user)

	body := `{"username":"dave","password":"wrongpass"}`
	req := httptest.NewRequest(http.MethodPost, "/login", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rr.Code)
	}
}

func TestLogin_UnknownUser(t *testing.T) {
	_, r := newAuthRouter(t)

	body := `{"username":"nobody","password":"pass"}`
	req := httptest.NewRequest(http.MethodPost, "/login", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rr.Code)
	}
}
