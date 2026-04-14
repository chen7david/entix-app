// TOMBSTONED - EN-312: payment-requests schema migration
//
// SessionPaymentEventsRepository has been replaced by PaymentRequestsRepository.
// The underlying `financial_session_payment_events` table was removed as part of
// the EN-312 migration consolidation into 0000_genesis_schema.sql.
//
// This file is retained to preserve Git history. Do NOT import from it.
// Use: import { PaymentRequestsRepository } from "./payment-requests.repository"
