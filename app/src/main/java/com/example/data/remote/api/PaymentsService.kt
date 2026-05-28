package com.example.data.remote.api

import retrofit2.Response
import retrofit2.http.*

// ---- Payments ----
data class InitPaymentRequest(val plan: String, val network: String, val phone: String)
data class InitPaymentResponse(val authorization_url: String, val reference: String)
data class VerifyPaymentResponse(val success: Boolean, val message: String?)

interface PaymentsService {
    @POST("api/payment/initialize")
    suspend fun initializePayment(@Body request: InitPaymentRequest): Response<InitPaymentResponse>

    @GET("api/payment/verify")
    suspend fun verifyPayment(@Query("reference") reference: String): Response<VerifyPaymentResponse>
}
