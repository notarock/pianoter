package server

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"

	"pianoter/internal/config"
	"pianoter/internal/db"
	"pianoter/internal/handlers"
	authmw "pianoter/internal/middleware"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func Run() {
	if len(os.Args) > 1 && os.Args[1] == "migrate" {
		RunMigrate(os.Args[2:])
		return
	}

	cfg := config.Load()

	database, err := db.New(cfg.DSN())
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}

	auth := &handlers.AuthHandler{DB: database, Secret: cfg.JWTSecret}
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
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	})

	r.Route("/api", func(r chi.Router) {
		// Public auth routes
		r.Post("/auth/register", auth.Register)
		r.Post("/auth/login", auth.Login)

		// Protected routes
		r.Group(func(r chi.Router) {
			r.Use(authmw.Authenticate(cfg.JWTSecret))

			r.Get("/composers", composers.List)
			r.Post("/composers", composers.Create)
			r.Get("/composers/{id}", composers.Get)
			r.Put("/composers/{id}", composers.Update)
			r.Delete("/composers/{id}", composers.Delete)

			r.Get("/pieces", pieces.List)
			r.Post("/pieces", pieces.Create)
			r.Get("/pieces/{id}", pieces.Get)
			r.Put("/pieces/{id}", pieces.Update)
			r.Delete("/pieces/{id}", pieces.Delete)

			r.Post("/pieces/{id}/sessions", sessions.Create)
			r.Get("/pieces/{id}/sessions", sessions.List)
		})
	})

	log.Printf("Listening on :%s", cfg.Port)
	log.Fatal(http.ListenAndServe(":"+cfg.Port, r))
}

func RunMigrate(args []string) {
	if len(args) == 0 {
		fmt.Fprintln(os.Stderr, "usage: pianoter migrate <up|down|up-to N|down-to N|status>")
		os.Exit(1)
	}

	cfg := config.Load()
	gormDB, err := db.OpenOnly(cfg.DSN())
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}

	direction := args[0]
	var target int64

	switch direction {
	case "up-to", "down-to":
		if len(args) < 2 {
			fmt.Fprintf(os.Stderr, "usage: pianoter migrate %s N\n", direction)
			os.Exit(1)
		}
		target, err = strconv.ParseInt(args[1], 10, 64)
		if err != nil {
			log.Fatalf("invalid version: %v", err)
		}
	}

	if err := db.RunMigrations(gormDB, direction, target); err != nil {
		log.Fatalf("migration failed: %v", err)
	}
}
