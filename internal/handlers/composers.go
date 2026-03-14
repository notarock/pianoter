package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"pianoter/internal/models"

	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"
)

type ComposerHandler struct {
	DB *gorm.DB
}

func (h *ComposerHandler) List(w http.ResponseWriter, r *http.Request) {
	uid := userIDFromCtx(r)
	var composers []models.Composer
	h.DB.Where("user_id = ?", uid).Find(&composers)
	respondJSON(w, composers)
}

func (h *ComposerHandler) Create(w http.ResponseWriter, r *http.Request) {
	var c models.Composer
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	c.UserID = userIDFromCtx(r)
	if result := h.DB.Create(&c); result.Error != nil {
		http.Error(w, result.Error.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	respondJSON(w, c)
}

func (h *ComposerHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var c models.Composer
	if result := h.DB.First(&c, id); result.Error != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	respondJSON(w, c)
}

func (h *ComposerHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var c models.Composer
	if result := h.DB.First(&c, id); result.Error != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	c.ID = uint(id)
	h.DB.Save(&c)
	respondJSON(w, c)
}
