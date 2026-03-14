package handlers

import (
	"encoding/json"
	"net/http"

	"pianoter/internal/middleware"
)

func respondJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}

func userIDFromCtx(r *http.Request) uint {
	v, _ := r.Context().Value(middleware.UserIDKey).(uint)
	return v
}
