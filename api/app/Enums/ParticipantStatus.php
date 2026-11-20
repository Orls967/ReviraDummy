<?php

namespace App\Enums;

enum ParticipantStatus: string
{
    case Booked = 'booked';
    case Cancelled = 'cancelled';
}
