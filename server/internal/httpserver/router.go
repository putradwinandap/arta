package httpserver

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/putradwinandap/arta/server/internal/finance"
)

func New(pool *pgxpool.Pool) http.Handler {
	r := chi.NewRouter()

	r.Get("/api/health", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	r.Get("/api/ready", func(w http.ResponseWriter, req *http.Request) {
		if err := pool.Ping(req.Context()); err != nil {
			writeJSON(w, http.StatusServiceUnavailable, map[string]string{"status": "not_ready"})
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"status": "ready"})
	})

	financeHandler := financeHandlers{service: finance.NewService(pool)}
	r.Route("/api/households", func(r chi.Router) {
		r.Post("/", financeHandler.createHousehold)
		r.Get("/{householdID}", financeHandler.getHousehold)
		r.Get("/{householdID}/finance", financeHandler.getFinanceOverview)
		r.Post("/{householdID}/transactions", financeHandler.createTransaction)
		r.Post("/{householdID}/transfers", financeHandler.createTransfer)
		r.Route("/{householdID}/captures", func(r chi.Router) {
			r.Post("/", financeHandler.createCapture)
			r.Get("/", financeHandler.listPendingCaptures)
			r.Patch("/{captureID}", financeHandler.reviewCapture)
			r.Post("/{captureID}/confirm", financeHandler.confirmCapture)
		})
		r.Route("/{householdID}/wallets", func(r chi.Router) {
			r.Post("/", financeHandler.createWallet)
			r.Get("/", financeHandler.listWallets)
			r.Get("/{walletID}", financeHandler.getWallet)
			r.Patch("/{walletID}", financeHandler.updateWallet)
			r.Post("/{walletID}/archive", financeHandler.archiveWallet)
		})
	})

	return r
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
