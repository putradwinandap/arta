package httpserver

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/google/uuid"
	"github.com/putradwinandap/arta/server/internal/backup"
)

type backupHandlers struct{ service *backup.Service }

func (h backupHandlers) exportHousehold(w http.ResponseWriter, r *http.Request) {
	id, ok := pathUUID(w, r, "householdID")
	if !ok {
		return
	}
	snapshot, err := h.service.Export(r.Context(), id)
	if err != nil {
		handleBackupError(w, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=arta-%s-backup.json", id))
	_ = json.NewEncoder(w).Encode(snapshot)
}

func (h backupHandlers) restoreHousehold(w http.ResponseWriter, r *http.Request) {
	id, ok := pathUUID(w, r, "householdID")
	if !ok {
		return
	}
	var input struct {
		Confirm bool            `json:"confirm"`
		Backup  backup.Snapshot `json:"backup"`
	}
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 20<<20))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_backup")
		return
	}
	if err := h.service.Restore(r.Context(), id, input.Backup, input.Confirm); err != nil {
		handleBackupError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"restored": true, "householdId": id})
}

func handleBackupError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, backup.ErrConfirmationRequired):
		writeError(w, http.StatusBadRequest, err.Error())
	case errors.Is(err, backup.ErrInvalidBackup), errors.Is(err, backup.ErrHouseholdMismatch):
		writeError(w, http.StatusUnprocessableEntity, err.Error())
	case errors.Is(err, backup.ErrUnsupportedVersion):
		writeError(w, http.StatusConflict, err.Error())
	default:
		handleFinanceError(w, err)
	}
}

var _ = uuid.Nil
