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

type PieceHandler struct {
	DB *gorm.DB
}

func (h *PieceHandler) List(w http.ResponseWriter, r *http.Request) {
	uid := userIDFromCtx(r)
	q := h.DB.Preload("Composer").Where("user_id = ?", uid)

	if status := r.URL.Query().Get("status"); status != "" {
		q = q.Where("status = ?", status)
	}
	if cid := r.URL.Query().Get("composer_id"); cid != "" {
		q = q.Where("composer_id = ?", cid)
	}
	if staleDays := r.URL.Query().Get("stale_days"); staleDays != "" {
		days, err := strconv.Atoi(staleDays)
		if err == nil {
			cutoff := time.Now().AddDate(0, 0, -days)
			q = q.Where("last_played_at IS NULL OR last_played_at < ?", cutoff)
		}
	}

	var pieces []models.Piece
	q.Find(&pieces)
	respondJSON(w, pieces)
}

func (h *PieceHandler) Create(w http.ResponseWriter, r *http.Request) {
	var p models.Piece
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	p.UserID = userIDFromCtx(r)
	if result := h.DB.Create(&p); result.Error != nil {
		http.Error(w, result.Error.Error(), http.StatusInternalServerError)
		return
	}
	h.DB.Preload("Composer").First(&p, p.ID)
	w.WriteHeader(http.StatusCreated)
	respondJSON(w, p)
}

func (h *PieceHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	uid := userIDFromCtx(r)
	var p models.Piece
	if result := h.DB.Preload("Composer").Where("user_id = ?", uid).First(&p, id); result.Error != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	respondJSON(w, p)
}

func (h *PieceHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	uid := userIDFromCtx(r)
	var p models.Piece
	if result := h.DB.Where("user_id = ?", uid).First(&p, id); result.Error != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	p.ID = uint(id)
	p.UserID = uid
	h.DB.Save(&p)
	h.DB.Preload("Composer").First(&p, p.ID)
	respondJSON(w, p)
}

func (h *PieceHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	uid := userIDFromCtx(r)
	result := h.DB.Where("user_id = ? AND id = ?", uid, id).Delete(&models.Piece{})
	if result.Error != nil {
		http.Error(w, result.Error.Error(), http.StatusInternalServerError)
		return
	}
	if result.RowsAffected == 0 {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
