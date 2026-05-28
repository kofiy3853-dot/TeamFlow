package com.example.data.remote.api

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

data class LoginRequest(val email: String, val passwordHash: String)
data class RegisterRequest(val fullname: String, val email: String, val passwordHash: String, val phone: String)
data class AuthResponse(val token: String, val user: UserDto)
data class UserDto(val id: String, val email: String, val fullname: String)

interface AuthService {
    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>

    @POST("api/auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>
}
