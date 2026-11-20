<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexTransactionRequest;
use App\Http\Requests\Admin\RejectTransactionRequest;
use App\Http\Resources\AdminTransactionResource;
use App\Models\Transaction;
use App\Services\Transactions\TransactionVerificationService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TransactionController extends Controller
{
    public function __construct(private readonly TransactionVerificationService $verification) {}

    public function index(IndexTransactionRequest $request): AnonymousResourceCollection
    {
        return AdminTransactionResource::collection($this->verification->paginate($request->status()));
    }

    public function approve(Request $request, Transaction $transaction): AdminTransactionResource
    {
        return new AdminTransactionResource($this->verification->approve($transaction, $request->user()));
    }

    public function reject(RejectTransactionRequest $request, Transaction $transaction): AdminTransactionResource
    {
        return new AdminTransactionResource(
            $this->verification->reject($transaction, $request->user(), $request->reason()),
        );
    }
}
