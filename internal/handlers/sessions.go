package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"pianoter/internal/models"

	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"
)

type SessionHandler struct {
	DB *gorm.DB
}

func (h *SessionHandler) Create(w http.ResponseWriter, r *http.Request) {
	pieceID, _ := strconv.Atoi(chi.URLParam(r, "id"))

	var s models.PlaySession
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	s.PieceID = uint(pieceID)
	if s.PlayedAt.IsZero() {
		s.PlayedAt = time.Now()
	}

	if result := h.DB.Create(&s); result.Error != nil {
		http.Error(w, result.Error.Error(), http.StatusInternalServerError)
		return
	}

	// Update piece's last_played_at
	h.DB.Model(&models.Piece{}).Where("id = ?", pieceID).Update("last_played_at", s.PlayedAt)

	w.WriteHeader(http.StatusCreated)
	respondJSON(w, s)
}

func (h *SessionHandler) List(w http.ResponseWriter, r *http.Request) {
	pieceID, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var sessions []models.PlaySession
	h.DB.Where("piece_id = ?", pieceID).Order("played_at desc").Find(&sessions)
	respondJSON(w, sessions)
}
