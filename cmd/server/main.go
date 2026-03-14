package main

import (
	"log"
	"net/http"

	"pianoter/internal/db"
	"pianoter/internal/handlers"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func main() {
	database, err := db.New("pianoter.db")
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}

	composers := &handlers.ComposerHandler{DB: database}
	pieces := &handlers.PieceHandler{DB: database}
	sessions := &handlers.SessionHandler{DB: database}

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	})

	r.Route("/api", func(r chi.Router) {
		r.Get("/composers", composers.List)
		r.Post("/composers", composers.Create)
		r.Get("/composers/{id}", composers.Get)
		r.Put("/composers/{id}", composers.Update)

		r.Get("/pieces", pieces.List)
		r.Post("/pieces", pieces.Create)
		r.Get("/pieces/{id}", pieces.Get)
		r.Put("/pieces/{id}", pieces.Update)
		r.Delete("/pieces/{id}", pieces.Delete)

		r.Post("/pieces/{id}/sessions", sessions.Create)
		r.Get("/pieces/{id}/sessions", sessions.List)
	})

	log.Println("Listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}
