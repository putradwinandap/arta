package httpserver

import (
	"encoding/json"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/putradwinandap/arta/server/internal/finance"
	"net/http"
)

func New(pool *pgxpool.Pool) http.Handler {
	r := chi.NewRouter()
	r.Get("/api/health", func(w http.ResponseWriter, _ *http.Request) { writeJSON(w, 200, map[string]string{"status": "ok"}) })
	r.Get("/api/ready", func(w http.ResponseWriter, req *http.Request) {
		if pool.Ping(req.Context()) != nil {
			writeJSON(w, 503, map[string]string{"status": "not_ready"})
			return
		}
		writeJSON(w, 200, map[string]string{"status": "ready"})
	})
	h := financeHandlers{service: finance.NewService(pool)}
	r.Route("/api/households", func(r chi.Router) {
		r.Post("/", h.createHousehold)
		r.Get("/{householdID}", h.getHousehold)
		r.Get("/{householdID}/finance", h.getFinanceOverview)
		r.Post("/{householdID}/transactions", h.createTransaction)
		r.Post("/{householdID}/transfers", h.createTransfer)
		r.Route("/{householdID}/budgets", func(r chi.Router) {
			r.Post("/", h.createBudget)
			r.Get("/", h.listBudgets)
			r.Get("/{budgetID}", h.getBudget)
		})
		r.Route("/{householdID}/goals", func(r chi.Router) {
			r.Post("/", h.createGoal)
			r.Get("/", h.listGoals)
			r.Get("/{goalID}", h.getGoal)
			r.Patch("/{goalID}", h.updateGoal)
			r.Post("/{goalID}/archive", h.archiveGoal)
			r.Post("/{goalID}/reserve", h.reserveGoal)
			r.Post("/{goalID}/release", h.releaseGoal)
		})
		r.Route("/{householdID}/captures", func(r chi.Router) {
			r.Post("/", h.createCapture)
			r.Get("/", h.listPendingCaptures)
			r.Patch("/{captureID}", h.reviewCapture)
			r.Post("/{captureID}/confirm", h.confirmCapture)
		})
		r.Route("/{householdID}/wallets", func(r chi.Router) {
			r.Post("/", h.createWallet)
			r.Get("/", h.listWallets)
			r.Get("/{walletID}", h.getWallet)
			r.Patch("/{walletID}", h.updateWallet)
			r.Post("/{walletID}/archive", h.archiveWallet)
		})
	})
	return r
}
func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
