package com.example.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.data.model.*
import com.example.data.repository.AppRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

sealed interface UiState<out T> {
    object Idle : UiState<Nothing>
    object Loading : UiState<Nothing>
    data class Success<out T>(val data: T) : UiState<T>
    data class Error(val message: String) : UiState<Nothing>
}

data class MoMoPaymentState(
    val status: String = "IDLE", // IDLE, PENDING_PIN, VERIFYING, SUCCESS, FAILED
    val amount: Double = 0.0,
    val planName: String = "",
    val provider: String = "",
    val network: String = "",
    val phone: String = "",
    val errorMessage: String = ""
)

class AppViewModel(private val repository: AppRepository) : ViewModel() {

    val currentUser: StateFlow<User?> = repository.currentUser

    private val _loginState = MutableStateFlow<UiState<User>>(UiState.Idle)
    val loginState: StateFlow<UiState<User>> = _loginState.asStateFlow()

    private val _registerState = MutableStateFlow<UiState<User>>(UiState.Idle)
    val registerState: StateFlow<UiState<User>> = _registerState.asStateFlow()

    private val _paymentState = MutableStateFlow<MoMoPaymentState>(MoMoPaymentState())
    val paymentState: StateFlow<MoMoPaymentState> = _paymentState.asStateFlow()

    // Teams
    val allTeams: StateFlow<List<Team>> = repository.getAllTeamsFlow()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val _selectedTeamId = MutableStateFlow<String?>(null)
    val selectedTeamId: StateFlow<String?> = _selectedTeamId.asStateFlow()

    val selectedTeam: StateFlow<Team?> = _selectedTeamId
        .flatMapLatest { id ->
            if (id == null) flowOf(null)
            else repository.getTeamFlow(id)
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    // Filtered / joined teams for logged in user
    val userJoinedTeams: StateFlow<List<Team>> = combine(allTeams, currentUser) { teams, user ->
        if (user == null) emptyList()
        else {
            if (user.role == "SUPER_ADMIN") {
                teams
            } else {
                val userTeamIds = user.joinedTeams.split(",").filter { it.isNotBlank() }
                teams.filter { userTeamIds.contains(it.id) }
            }
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Chat
    val activeChatMessages: StateFlow<List<Message>> = _selectedTeamId
        .flatMapLatest { id ->
            if (id == null) flowOf(emptyList())
            else repository.getMessagesForTeam(id)
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val typingUsers: StateFlow<Map<String, String>> = repository.typingUsers

    // Tasks
    val activeTasks: StateFlow<List<Task>> = _selectedTeamId
        .flatMapLatest { id ->
            if (id == null) flowOf(emptyList())
            else repository.getTasksByTeam(id)
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // User's own assigned tasks
    val userAssignedTasks: StateFlow<List<Task>> = currentUser
        .flatMapLatest { user ->
            if (user == null) flowOf(emptyList())
            else repository.getTasksByAssignee(user.email)
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Notifications
    val notifications: StateFlow<List<AppNotification>> = currentUser
        .flatMapLatest { user ->
            if (user == null) flowOf(emptyList())
            else repository.getNotificationsFlow(user.email)
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Administration states
    val allUsers: StateFlow<List<User>> = repository.getAllUsersFlow()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allPayments: StateFlow<List<Payment>> = repository.getAllPayments()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Action Methods
    fun login(email: String, passwordHash: String) {
        viewModelScope.launch {
            _loginState.value = UiState.Loading
            val res = repository.login(email, passwordHash)
            res.onSuccess {
                _loginState.value = UiState.Success(it)
                // Automatically set first team as selected team if available
                val tIds = it.joinedTeams.split(",").filter { id -> id.isNotBlank() }
                if (tIds.isNotEmpty() && _selectedTeamId.value == null) {
                    _selectedTeamId.value = tIds.first()
                }
            }.onFailure {
                _loginState.value = UiState.Error(it.message ?: "Authentication failed")
            }
        }
    }

    fun register(fullname: String, email: String, phone: String, passwordHash: String, isSuperAdmin: Boolean = false) {
        viewModelScope.launch {
            _registerState.value = UiState.Loading
            val res = repository.register(fullname, email, phone, passwordHash, isSuperAdmin)
            res.onSuccess {
                _registerState.value = UiState.Success(it)
            }.onFailure {
                _registerState.value = UiState.Error(it.message ?: "Registration failed")
            }
        }
    }

    fun logout() {
        repository.logout()
        _loginState.value = UiState.Idle
        _registerState.value = UiState.Idle
        _selectedTeamId.value = null
        _paymentState.value = MoMoPaymentState()
    }

    fun resetAuthState() {
        _loginState.value = UiState.Idle
        _registerState.value = UiState.Idle
    }

    fun selectTeam(teamId: String) {
        _selectedTeamId.value = teamId
    }

    // Payment Actions
    fun initiateMoMoPayment(planName: String, amount: Double, provider: String, network: String, phone: String) {
        _paymentState.value = MoMoPaymentState(
            status = "PENDING_PIN",
            amount = amount,
            planName = planName,
            provider = provider,
            network = network,
            phone = phone
        )
    }

    fun submitMoMoPin(pin: String) {
        val current = _paymentState.value
        if (pin.length < 4) {
            _paymentState.value = current.copy(errorMessage = "PIN must be at least 4 digits")
            return
        }

        viewModelScope.launch {
            _paymentState.value = current.copy(status = "VERIFYING", errorMessage = "")
            
            // Simulate Payment Provider background HTTP validation hook (3 seconds delay)
            kotlinx.coroutines.delay(2500)
            
            val user = currentUser.value
            if (user != null) {
                val res = repository.processMoMoPayment(
                    userEmail = user.email,
                    amount = current.amount,
                    planName = current.planName,
                    provider = current.provider,
                    network = current.network,
                    phone = current.phone
                )
                
                res.onSuccess {
                    _paymentState.value = current.copy(status = "SUCCESS")
                    // Prepopulate with a default welcome team for the active customer
                    repository.createTeam(
                        name = "Success Squad Launcher",
                        description = "Welcome to TeamFlow! This is your pre-configured, real-time sandbox team space.",
                        ownerEmail = user.email
                    ).onSuccess { welcomeTeam ->
                        _selectedTeamId.value = welcomeTeam.id
                    }
                }.onFailure {
                    _paymentState.value = current.copy(status = "FAILED", errorMessage = it.message ?: "MoMo network timeout.")
                }
            } else {
                _paymentState.value = current.copy(status = "FAILED", errorMessage = "Session clean up. Register again.")
            }
        }
    }

    fun cancelPayment() {
        _paymentState.value = MoMoPaymentState()
    }

    // Team Actions
    fun createTeam(name: String, description: String) {
        val user = currentUser.value ?: return
        viewModelScope.launch {
            repository.createTeam(name, description, user.email).onSuccess { team ->
                _selectedTeamId.value = team.id
            }
        }
    }

    fun joinTeam(inviteCode: String, onComplete: (Boolean, String) -> Unit) {
        val user = currentUser.value ?: return
        viewModelScope.launch {
            val res = repository.joinTeam(inviteCode, user.email)
            res.onSuccess { team ->
                _selectedTeamId.value = team.id
                onComplete(true, "Successfully joined ${team.name}!")
            }.onFailure {
                onComplete(false, it.message ?: "Could not join team.")
            }
        }
    }

    fun promoteMember(teamId: String, memberEmail: String) {
        viewModelScope.launch {
            repository.promoteMember(teamId, memberEmail)
        }
    }

    fun removeMember(teamId: String, memberEmail: String) {
        viewModelScope.launch {
            repository.removeMember(teamId, memberEmail)
        }
    }

    // Chat Actions
    fun sendChatMessage(content: String) {
        val teamId = _selectedTeamId.value ?: return
        val user = currentUser.value ?: return
        if (content.isBlank()) return
        viewModelScope.launch {
            repository.sendMessage(teamId, user.email, user.fullname, content)
        }
    }

    // Task Actions
    fun createTeamTask(title: String, description: String, assignedEmail: String, assignedName: String, priority: String, status: String = "TODO") {
        val teamId = _selectedTeamId.value ?: return
        viewModelScope.launch {
            repository.createTask(teamId, title, description, assignedEmail, assignedName, priority, status)
        }
    }

    fun updateTaskStatus(taskId: String, status: String) {
        val user = currentUser.value ?: return
        viewModelScope.launch {
            repository.updateTaskStatus(taskId, status, user.fullname)
        }
    }

    fun addTaskComment(taskId: String, content: String) {
        val user = currentUser.value ?: return
        if (content.isBlank()) return
        viewModelScope.launch {
            repository.addTaskComment(taskId, user.fullname, content)
        }
    }

    // Notifications Action
    fun markNotificationRead(id: String) {
        viewModelScope.launch {
            repository.markNotificationAsRead(id)
        }
    }

    fun markAllNotificationsRead() {
        val user = currentUser.value ?: return
        viewModelScope.launch {
            repository.markAllNotificationsAsRead(user.email)
        }
    }

    // Admin dashboard: update user account fields directly
    fun adminUpdateUser(email: String, role: String, subStatus: String) {
        viewModelScope.launch {
            repository.updateUserRoleOrStatus(email, role, subStatus)
        }
    }

    class Factory(private val repository: AppRepository) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            if (modelClass.isAssignableFrom(AppViewModel::class.java)) {
                return AppViewModel(repository) as T
            }
            throw IllegalArgumentException("Unknown ViewModel class")
        }
    }
}
