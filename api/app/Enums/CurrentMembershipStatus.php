<?php

namespace App\Enums;

/**
 * Status membership terkini seorang member, diturunkan dari seluruh riwayat membership-nya.
 * Urutan case adalah urutan prioritas saat beberapa kategori berlaku bersamaan.
 */
enum CurrentMembershipStatus: string
{
    case Active = 'active';
    case Pending = 'pending';
    case Upcoming = 'upcoming';
    case Expired = 'expired';
    case None = 'none';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
