package httpserver

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/putradwinandap/arta/server/internal/auth"
	"github.com/putradwinandap/arta/server/internal/backup"
	"github.com/putradwinandap/arta/server/internal/finance"
)

func New(pool *pgxpool.Pool) http.Handler {
	r := chi.NewRouter()
	r.Get("/api/health", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, 200, map[string]string{"status": "ok"})
	})
	r.Get("/api/ready", func(w http.ResponseWriter, req *http.Request) {
		if pool.Ping(req.Context()) != nil {
			writeJSON(w, 503, map[string]string{"status": "not_ready"})
			return
		}
		writeJSON(w, 200, map[string]string{"status": "ready"})
	})

	authService := auth.NewService(pool)
	ah := authHandlers{service: authService}
	ih := inviteHandlers{service: authService}
	r.Post("/api/auth/register", ah.register)
	r.Post("/api/auth/login", ah.login)
	r.Group(func(r chi.Router) {
		r.Use(requireAuthentication(authService))
		r.Get("/api/auth/me", ah.me)
		r.Get("/api/auth/households", ah.households)
		r.Post("/api/auth/logout", ah.logout)
		r.Post("/api/invites/redeem", ih.redeem)
	})

	h := financeHandlers{service: finance.NewService(pool)}
	bh := backupHandlers{service: backup.NewService(pool)}
	r.Route("/api/households", func(r chi.Router) {
		r.Use(requireAuthentication(authService))
		r.Post("/", h.createHousehold)
		r.Route("/{householdID}", func(r chi.Router) {
			r.Use(requireHouseholdMembership(authService))
			r.Get("/", h.getHousehold)
			r.Post("/invites", ih.create)
			r.Get("/finance", h.getFinanceOverview)
			r.Get("/backup", bh.exportHousehold)
			r.Post("/restore", bh.restoreHousehold)
			r.Post("/transactions", h.createTransaction)
			r.Post("/transfers", h.createTransfer)
			r.Route("/budgets", func(r chi.Router) {
				r.Post("/", h.createBudget)
				r.Get("/", h.listBudgets)
				r.Get("/{budgetID}", h.getBudget)
			})
			r.Route("/goals", func(r chi.Router) {
				r.Post("/", h.createGoal)
				r.Get("/", h.listGoals)
				r.Get("/{goalID}", h.getGoal)
				r.Patch("/{goalID}", h.updateGoal)
				r.Post("/{goalID}/archive", h.archiveGoal)
				r.Post("/{goalID}/reserve", h.reserveGoal)
				r.Post("/{goalID}/release", h.releaseGoal)
			})
			r.Route("/captures", func(r chi.Router) {
				r.Post("/", h.createCapture)
				r.Get("/", h.listPendingCaptures)
				r.Patch("/{captureID}", h.reviewCapture)
				r.Post("/{captureID}/confirm", h.confirmCapture)
			})
			r.Route("/reconciliations", func(r chi.Router) {
				r.Get("/", h.listReconciliations)
				r.Post("/{reconciliationID}/adjust", h.adjustReconciliation)
			})
			r.Route("/wallets", func(r chi.Router) {
				r.Post("/", h.createWallet)
				r.Get("/", h.listWallets)
				r.Get("/{walletID}", h.getWallet)
				r.Patch("/{walletID}", h.updateWallet)
				r.Post("/{walletID}/archive", h.archiveWallet)
				r.Post("/{walletID}/reconcile", h.createReconciliation)
			})
		})
	})
	return r
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
