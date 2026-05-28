package com.example.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.remote.api.AuthService
import com.example.data.remote.api.LoginRequest
import com.example.data.remote.api.RegisterRequest
import com.example.data.prefs.TokenManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class AuthViewModel(
    private val authService: AuthService,
    private val tokenManager: TokenManager
) : ViewModel() {

    private val _loginState = MutableStateFlow<UiState<Boolean>>(UiState.Idle)
    val loginState: StateFlow<UiState<Boolean>> = _loginState.asStateFlow()

    private val _registerState = MutableStateFlow<UiState<Boolean>>(UiState.Idle)
    val registerState: StateFlow<UiState<Boolean>> = _registerState.asStateFlow()

    fun login(email: String, passwordHash: String) {
        viewModelScope.launch {
            _loginState.value = UiState.Loading
            try {
                val response = authService.login(LoginRequest(email, passwordHash))
                if (response.isSuccessful && response.body() != null) {
                    val authResponse = response.body()!!
                    tokenManager.saveToken(authResponse.token)
                    // TODO: Notify AppRepository to update local currentUser based on authResponse.user
                    _loginState.value = UiState.Success(true)
                } else {
                    _loginState.value = UiState.Error("Login failed: ${response.message()}")
                }
            } catch (e: Exception) {
                _loginState.value = UiState.Error(e.message ?: "Network error")
            }
        }
    }

    fun register(fullname: String, email: String, phone: String, passwordHash: String) {
        viewModelScope.launch {
            _registerState.value = UiState.Loading
            try {
                val response = authService.register(RegisterRequest(fullname, email, passwordHash, phone))
                if (response.isSuccessful && response.body() != null) {
                    val authResponse = response.body()!!
                    tokenManager.saveToken(authResponse.token)
                    _registerState.value = UiState.Success(true)
                } else {
                    _registerState.value = UiState.Error("Registration failed: ${response.message()}")
                }
            } catch (e: Exception) {
                _registerState.value = UiState.Error(e.message ?: "Network error")
            }
        }
    }

    fun resetState() {
        _loginState.value = UiState.Idle
        _registerState.value = UiState.Idle
    }
}
