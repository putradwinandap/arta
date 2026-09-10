package backup

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const Format = "arta-household-backup"
const Version = 1

var (
	ErrInvalidBackup = errors.New("invalid_backup")
	ErrUnsupportedVersion = errors.New("unsupported_backup_version")
	ErrHouseholdMismatch = errors.New("backup_household_mismatch")
	ErrConfirmationRequired = errors.New("restore_confirmation_required")
)

type Snapshot struct {
	Format string `json:"format"`
	Version int `json:"version"`
	ExportedAt time.Time `json:"exportedAt"`
	HouseholdID uuid.UUID `json:"householdId"`
	Tables map[string][]map[string]any `json:"tables"`
}

type Service struct { pool *pgxpool.Pool; now func() time.Time }
func NewService(pool *pgxpool.Pool) *Service { return &Service{pool:pool, now:time.Now} }

var tableOrder = []string{"households","household_members","wallets","transactions","transfers","transaction_captures","budgets","financial_goals","goal_reservation_events","balance_adjustments","wallet_reconciliations"}
var deleteOrder = []string{"wallet_reconciliations","balance_adjustments","goal_reservation_events","transaction_captures","financial_goals","budgets","transfers","transactions","wallets","household_members"}

func (s *Service) Export(ctx context.Context, householdID uuid.UUID) (Snapshot,error) {
	var exists bool
	if err:=s.pool.QueryRow(ctx,"SELECT EXISTS(SELECT 1 FROM households WHERE id=$1)",householdID).Scan(&exists); err!=nil || !exists { if err==nil { err=pgx.ErrNoRows }; return Snapshot{},err }
	out:=Snapshot{Format:Format,Version:Version,ExportedAt:s.now().UTC(),HouseholdID:householdID,Tables:map[string][]map[string]any{}}
	for _,table:=range tableOrder {
		rows,err:=s.pool.Query(ctx,fmt.Sprintf("SELECT to_jsonb(t) FROM %s t WHERE household_id=$1 ORDER BY id",table),householdID)
		if table=="households" { rows,err=s.pool.Query(ctx,"SELECT to_jsonb(t) FROM households t WHERE id=$1",householdID) }
		if err!=nil{return Snapshot{},err}
		items:=[]map[string]any{}
		for rows.Next(){ var raw []byte; if err:=rows.Scan(&raw);err!=nil{rows.Close();return Snapshot{},err}; var item map[string]any; if json.Unmarshal(raw,&item)!=nil{rows.Close();return Snapshot{},ErrInvalidBackup}; items=append(items,item) }
		if err:=rows.Err();err!=nil{rows.Close();return Snapshot{},err}; rows.Close(); out.Tables[table]=items
	}
	return out,nil
}

func Validate(snapshot Snapshot, householdID uuid.UUID) error {
	if snapshot.Format!=Format || snapshot.Version!=Version || snapshot.HouseholdID==uuid.Nil || snapshot.Tables==nil { return ErrInvalidBackup }
	if snapshot.HouseholdID!=householdID { return ErrHouseholdMismatch }
	for _,name:=range tableOrder { if _,ok:=snapshot.Tables[name];!ok{return ErrInvalidBackup} }
	if len(snapshot.Tables["households"])!=1{return ErrInvalidBackup}
	for _,name:=range tableOrder { for _,row:=range snapshot.Tables[name] { id,ok:=row["id"].(string); if !ok { return ErrInvalidBackup }; if _,err:=uuid.Parse(id);err!=nil{return ErrInvalidBackup}; key:="household_id"; if name=="households"{key="id"}; hv,ok:=row[key].(string); if !ok || hv!=householdID.String(){return ErrHouseholdMismatch} } }
	return nil
}

func (s *Service) Restore(ctx context.Context, householdID uuid.UUID, snapshot Snapshot, confirmed bool) error {
	if !confirmed{return ErrConfirmationRequired}
	if snapshot.Version!=Version && snapshot.Format==Format{return ErrUnsupportedVersion}
	if err:=Validate(snapshot,householdID);err!=nil{return err}
	tx,err:=s.pool.Begin(ctx); if err!=nil{return err}; defer tx.Rollback(ctx)
	for _,table:=range deleteOrder { if _,err:=tx.Exec(ctx,fmt.Sprintf("DELETE FROM %s WHERE household_id=$1",table),householdID);err!=nil{return err} }
	if _,err:=tx.Exec(ctx,"DELETE FROM households WHERE id=$1",householdID);err!=nil{return err}
	for _,table:=range tableOrder { for _,row:=range snapshot.Tables[table] { raw,err:=json.Marshal(row);if err!=nil{return ErrInvalidBackup}; q:=fmt.Sprintf("INSERT INTO %s SELECT * FROM jsonb_populate_record(NULL::%s,$1::jsonb)",table,table); if _,err:=tx.Exec(ctx,q,string(raw));err!=nil{return err} } }
	return tx.Commit(ctx)
}
