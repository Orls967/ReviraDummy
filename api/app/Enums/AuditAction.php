<?php

namespace App\Enums;

enum AuditAction: string
{
    case AdminLoggedIn = 'auth.admin_login';
    case PlanCreated = 'plan.created';
    case PlanUpdated = 'plan.updated';
    case PlanDeleted = 'plan.deleted';
    case TransactionApproved = 'transaction.approved';
    case TransactionRejected = 'transaction.rejected';
    case ScheduleCreated = 'schedule.created';
    case ScheduleUpdated = 'schedule.updated';
    case ScheduleStatusChanged = 'schedule.status_changed';
    case ScheduleDeleted = 'schedule.deleted';

    public function label(): string
    {
        return match ($this) {
            self::AdminLoggedIn => 'Admin masuk',
            self::PlanCreated => 'Paket dibuat',
            self::PlanUpdated => 'Paket diubah',
            self::PlanDeleted => 'Paket dihapus',
            self::TransactionApproved => 'Transaksi disetujui',
            self::TransactionRejected => 'Transaksi ditolak',
            self::ScheduleCreated => 'Sesi dibuat',
            self::ScheduleUpdated => 'Sesi diubah',
            self::ScheduleStatusChanged => 'Status sesi diubah',
            self::ScheduleDeleted => 'Sesi dihapus',
        };
    }
}
